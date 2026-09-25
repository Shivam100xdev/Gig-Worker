import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireSessionUser } from "../middleware/authUse.js";
import { prisma } from "../lib/prisma.js";
import { irisIrpService } from "../services/irisIrpService.js";
import { GST_REGISTRATION_THRESHOLD } from "../lib/taxConstants.js";

/**
 * GST desk:
 *   GET  /api/gst/summary      turnover vs ₹20L threshold + registration nudge
 *   GET  /api/gst/invoices     list invoices (with IRN status)
 *   POST /api/gst/invoices     create invoice (tax auto-split CGST/SGST/IGST)
 *   POST /api/gst/invoices/:id/generate-irn   e-invoice via IRIS IRP
 *
 * GSTIN validation + the e-invoice payload follow the IRP schema subset in
 * irisIrpService; IRN generation is simulation-mode until IRIS_* env vars
 * are set (see backend/.env.example).
 */

const router = Router();
requireAuth; // keep import used across all route guards below

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

const invoiceSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  customerGstin: z.string().trim().regex(GSTIN_RE).optional().or(z.literal("")),
  invoiceNumber: z.string().trim().min(1).max(40),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxableValue: z.number().positive().max(1e9),
  gstRate: z.union([z.literal(0), z.literal(5), z.literal(12), z.literal(18), z.literal(28)]),
  isInterState: z.boolean().default(false),
});

router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const [user, invoices] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.gstInvoice.findMany({ where: { userId } }),
    ]);

    const invoiceTurnover = invoices.reduce((s, i) => s + Number(i.taxableValue), 0);
    const records = await prisma.incomeRecord.aggregate({
      where: { userId },
      _sum: { incomeAmount: true },
    });
    const ledgerTurnover = Number(records._sum.incomeAmount ?? 0);
    const aggregateTurnover = Math.max(invoiceTurnover, ledgerTurnover);

    res.json({
      gstin: user?.gstin ?? null,
      aggregateTurnover,
      threshold: GST_REGISTRATION_THRESHOLD,
      registrationLikelyRequired: aggregateTurnover > GST_REGISTRATION_THRESHOLD,
      invoices: { count: invoices.length, taxableValue: invoiceTurnover },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/invoices", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const invoices = await prisma.gstInvoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({
      invoices: invoices.map((i) => ({
        id: i.id,
        customerName: i.customerName,
        customerGstin: i.customerGstin,
        invoiceNumber: i.invoiceNumber,
        invoiceDate: i.invoiceDate,
        taxableValue: Number(i.taxableValue),
        gstRate: Number(i.gstRate),
        cgst: Number(i.cgst),
        sgst: Number(i.sgst),
        igst: Number(i.igst),
        total: Number(i.total),
        irn: i.irn,
        irnGenerated: i.irnGenerated,
        ackNo: i.ackNo,
        mode: i.irnGenerated ? "generated" : "draft",
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/invoices", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const input = invoiceSchema.parse(req.body);

    const tax = input.taxableValue * (input.gstRate / 100);
    const invoice = await prisma.gstInvoice.create({
      data: {
        userId,
        customerName: input.customerName,
        customerGstin: input.customerGstin || null,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: new Date(input.invoiceDate),
        taxableValue: input.taxableValue,
        gstRate: input.gstRate,
        cgst: input.isInterState ? 0 : tax / 2,
        sgst: input.isInterState ? 0 : tax / 2,
        igst: input.isInterState ? tax : 0,
        total: input.taxableValue + tax,
      },
    });
    res.status(201).json({ invoiceId: invoice.id });
  } catch (err) {
    next(err);
  }
});

router.post("/invoices/:id/generate-irn", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const [user, invoice] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.gstInvoice.findFirst({ where: { id: req.params.id, userId } }),
    ]);
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found." });
      return;
    }
    if (!user?.gstin) {
      res.status(400).json({ error: "Add your GSTIN in Profile before generating e-invoices." });
      return;
    }

    const result = await irisIrpService.generateIrn({
      sellerGstin: user.gstin,
      buyerGstin: invoice.customerGstin,
      buyerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
      taxableValue: Number(invoice.taxableValue),
      gstRate: Number(invoice.gstRate),
      isInterState: Number(invoice.igst) > 0,
    });

    const updated = await prisma.gstInvoice.update({
      where: { id: invoice.id },
      data: {
        irn: result.irn,
        irnGenerated: true,
        ackNo: result.ackNo,
        ackDate: new Date(result.ackDate),
      },
    });

    res.json({
      irn: updated.irn,
      ackNo: updated.ackNo,
      mode: result.mode,
      payload: result.payloadSent,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
