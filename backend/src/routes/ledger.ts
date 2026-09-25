import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireSessionUser } from "../middleware/authUse.js";
import { prisma } from "../lib/prisma.js";
import { computeTaxBackend } from "../lib/taxConstants.js";

/**
 * Ledger + filing — implements the routes the frontend's
 * platformService/itrService already imply, now against Postgres:
 *   GET/POST/DELETE /api/platforms
 *   GET/POST/PATCH/DELETE /api/records
 *   POST /api/itr/file, POST /api/itr/export
 */

const router = Router();

// ---------------- Platforms ----------------

router.get("/platforms", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const platforms = await prisma.platform.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { records: true } } },
    });
    res.json({
      platforms: platforms.map((p) => ({ id: p.id, name: p.name, category: p.category, hasRecords: p.hasRecords || p._count.records > 0, createdAt: p.createdAt })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/platforms", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const input = z
      .object({ name: z.string().trim().min(1).max(120), category: z.string().min(2).max(40) })
      .parse(req.body);
    const platform = await prisma.platform.create({ data: { userId, name: input.name, category: input.category } });
    res.status(201).json({ platform: { id: platform.id, name: platform.name, category: platform.category, hasRecords: false, createdAt: platform.createdAt } });
  } catch (err) {
    next(err);
  }
});

router.delete("/platforms/:id", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    await prisma.platform.deleteMany({ where: { id: req.params.id, userId } }); // cascades records
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------- Income records ----------------

const recordSchema = z.object({
  platformId: z.string().uuid(),
  incomeAmount: z.number().positive(),
  correspondingTax: z.number().min(0).default(0),
  taxDeductionSource: z.enum(["none", "platform_tds", "client_tds"]).default("none"),
  workStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxPayDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientName: z.string().trim().max(160).default(""),
  clientEmail: z.string().trim().email().or(z.literal("")).default(""),
  notes: z.string().max(2000).optional(),
});

router.get("/records", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const records = await prisma.incomeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { platform: { select: { name: true, category: true } } },
    });
    res.json({
      records: records.map((r) => ({
        id: r.id,
        platformId: r.platformId,
        platformName: r.platform.name,
        incomeAmount: Number(r.incomeAmount),
        correspondingTax: Number(r.correspondingTax),
        taxDeductionSource: r.taxDeductionSource,
        paymentStatus: r.paymentStatus,
        receiptConfirmed: r.receiptConfirmed,
        receiptFileName: r.receiptFileName,
        workStartDate: r.workStartDate,
        workEndDate: r.workEndDate,
        taxPayDeadline: r.taxPayDeadline,
        client: { name: r.clientName, email: r.clientEmail },
        source: r.source,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/records", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const input = recordSchema.parse(req.body);

    const platform = await prisma.platform.findFirst({ where: { id: input.platformId, userId } });
    if (!platform) {
      res.status(404).json({ error: "Platform not found." });
      return;
    }

    const [record] = await prisma.$transaction([
      prisma.incomeRecord.create({
        data: {
          userId,
          platformId: input.platformId,
          incomeAmount: input.incomeAmount,
          correspondingTax: input.correspondingTax,
          taxDeductionSource: input.taxDeductionSource,
          paymentStatus: "not_paid",
          receiptConfirmed: input.taxDeductionSource === "none",
          workStartDate: new Date(input.workStartDate),
          workEndDate: new Date(input.workEndDate),
          taxPayDeadline: new Date(input.taxPayDeadline),
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          notes: input.notes,
          source: "manual",
        },
      }),
      prisma.platform.update({ where: { id: input.platformId }, data: { hasRecords: true } }),
    ]);

    res.status(201).json({ recordId: record.id });
  } catch (err) {
    next(err);
  }
});

router.patch("/records/:id", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const patch = z
      .object({
        paymentStatus: z.enum(["paid", "not_paid", "partially_paid"]).optional(),
        receiptConfirmed: z.boolean().optional(),
        receiptFileName: z.string().max(255).optional(),
      })
      .parse(req.body);

    const record = await prisma.incomeRecord.findFirst({ where: { id: req.params.id, userId } });
    if (!record) {
      res.status(404).json({ error: "Record not found." });
      return;
    }
    await prisma.incomeRecord.update({ where: { id: record.id }, data: patch });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/records/:id", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    await prisma.incomeRecord.deleteMany({ where: { id: req.params.id, userId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------- ITR filing ----------------

router.post("/itr/file", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const payload = z
      .object({
        assessmentYear: z.string().optional(),
        taxpayer: z
          .object({
            name: z.string().trim().min(1).optional(),
            pan: z.string().trim().min(1).optional(),
          })
          .optional(),
      })
      .parse(req.body);

    const [user, records] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.incomeRecord.findMany({ where: { userId } }),
    ]);
    if (!user) {
      res.status(401).json({ error: "Sign in to continue." });
      return;
    }

    // The review screen lets the user confirm/edit name + PAN as part of
    // filing — persist that here instead of silently discarding it and
    // checking stale DB values.
    const name = payload.taxpayer?.name ?? user.name;
    const pan = payload.taxpayer?.pan ?? user.pan;
    const profile = name !== user.name || pan !== user.pan
      ? await prisma.user.update({ where: { id: userId }, data: { name, pan } })
      : user;

    if (!profile.pan || !profile.name) {
      res.status(422).json({ error: "Complete your profile (name, PAN) and log at least one income entry before filing." });
      return;
    }
    const unconfirmed = records.filter((r) => r.paymentStatus === "paid" && !r.receiptConfirmed);
    if (unconfirmed.length > 0) {
      res.status(422).json({ error: "Confirm receipts for all paid entries before filing." });
      return;
    }

    const gross = records.reduce((s, r) => s + Number(r.incomeAmount), 0);
    const paid = records.reduce((s, r) => s + Number(r.correspondingTax), 0);
    const computation = computeTaxBackend(gross, paid);

    const platforms = await prisma.platform.findMany({
      where: { userId, records: { some: {} } },
      include: { records: true },
    });
    const incomeSources = platforms.map((p) => ({
      platformName: p.name,
      category: p.category,
      grossIncome: p.records.reduce((s, r) => s + Number(r.incomeAmount), 0),
      taxDeducted: p.records.reduce((s, r) => s + Number(r.correspondingTax), 0),
    }));

    const acknowledgementNumber = `GIG${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    const filing = await prisma.itrFiling.create({
      data: {
        userId,
        assessmentYear: payload.assessmentYear ?? "2026-27",
        regime: "new",
        computation,
        incomeSources,
        status: "submitted",
        acknowledgementNumber,
      },
    });

    res.status(201).json({
      acknowledgementNumber: filing.acknowledgementNumber,
      filedAt: filing.filedAt,
      status: "submitted" as const,
      computation,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/itr/export", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const filings = await prisma.itrFiling.findMany({
      where: { userId },
      orderBy: { filedAt: "desc" },
      take: 1,
    });
    if (filings.length === 0) {
      res.status(404).json({ error: "Nothing filed yet — file a return first." });
      return;
    }
    const f = filings[0];
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="itr-${f.assessmentYear}.json"`);
    res.send(JSON.stringify({ assessmentYear: f.assessmentYear, computation: f.computation, incomeSources: f.incomeSources, acknowledgementNumber: f.acknowledgementNumber, filedAt: f.filedAt }, null, 2));
  } catch (err) {
    next(err);
  }
});

// ---------------- Dashboard summary (cached) ----------------

router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const records = await prisma.incomeRecord.findMany({
      where: { userId },
      select: { incomeAmount: true, correspondingTax: true, paymentStatus: true, receiptConfirmed: true },
    });
    const gross = records.reduce((s, r) => s + Number(r.incomeAmount), 0);
    const paid = records.reduce((s, r) => s + Number(r.correspondingTax), 0);
    const computation = computeTaxBackend(gross, paid);
    res.json({
      totals: {
        grossIncome: gross,
        taxPaid: paid,
        liability: computation.totalTaxLiability,
        balancePayable: computation.balancePayable,
      },
      entryCount: records.length,
      unconfirmedReceipts: records.filter((r) => r.paymentStatus === "paid" && !r.receiptConfirmed).length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;