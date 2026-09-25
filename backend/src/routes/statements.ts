import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth, requireSessionUser } from "../middleware/authUse.js";
import { prisma } from "../lib/prisma.js";
import { ocrService } from "../services/ocrService.js";

/**
 * Bank-statement import: upload -> OCR -> review -> accept into ledger.
 *
 * POST /api/statements            multipart upload (pdf/png/jpg, <= 10MB)
 * GET  /api/statements            list the user's statements
 * GET  /api/statements/:id        statement + its proposed transactions
 * POST /api/statements/:id/accept accept selected transactions; each becomes
 *                                 an income_record (source = "ocr_import")
 */

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["application/pdf", "image/png", "image/jpeg"].includes(file.mimetype);
    cb(null, ok);
  },
});

router.post("/", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    if (!req.file) {
      res.status(400).json({ error: "Attach a PDF, PNG or JPG bank statement." });
      return;
    }

    const statement = await prisma.bankStatement.create({
      data: {
        userId,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        ocrStatus: "processing",
      },
    });

    try {
      const text = await ocrService.extractText(req.file.buffer, req.file.mimetype);
      const txns = ocrService.parseTransactions(text).filter((t) => t.direction === "in");
      await prisma.statementTransaction.createMany({
        data: txns.map((t) => ({
          statementId: statement.id,
          rawText: t.rawText,
          amount: t.amount,
          direction: t.direction,
          txnDate: t.txnDate ? new Date(t.txnDate) : null,
          narration: t.narration,
          counterparty: t.counterparty,
        })),
      });
      await prisma.bankStatement.update({
        where: { id: statement.id },
        data: { ocrStatus: "done", errorMessage: txns.length === 0 ? "No credit transactions detected — double-check the file." : null },
      });
      res.status(201).json({ statementId: statement.id, transactionsFound: txns.length });
    } catch (ocrErr) {
      await prisma.bankStatement.update({
        where: { id: statement.id },
        data: { ocrStatus: "failed", errorMessage: ocrErr instanceof Error ? ocrErr.message : "OCR failed" },
      });
      throw ocrErr;
    }
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const statements = await prisma.bankStatement.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      include: { transactions: { select: { isAccepted: true, amount: true } } },
    });
    res.json({
      statements: statements.map((s) => ({
        id: s.id,
        fileName: s.fileName,
        ocrStatus: s.ocrStatus,
        errorMessage: s.errorMessage,
        uploadedAt: s.uploadedAt,
        txCount: s.transactions.length,
        acceptedCount: s.transactions.filter((t) => t.isAccepted).length,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const statement = await prisma.bankStatement.findFirst({
      where: { id: req.params.id, userId },
      include: { transactions: { orderBy: { createdAt: "asc" } } },
    });
    if (!statement) {
      res.status(404).json({ error: "Statement not found." });
      return;
    }
    res.json({
      statement: {
        id: statement.id,
        fileName: statement.fileName,
        ocrStatus: statement.ocrStatus,
        errorMessage: statement.errorMessage,
        uploadedAt: statement.uploadedAt,
      },
      transactions: statement.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        txnDate: t.txnDate,
        narration: t.narration,
        counterparty: t.counterparty,
        rawText: t.rawText,
        isAccepted: t.isAccepted,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const acceptSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(500),
  platformId: z.string().uuid(),
});

router.post("/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const { transactionIds, platformId } = acceptSchema.parse(req.body);

    // Validate the platform belongs to this user before writing.
    const platform = await prisma.platform.findFirst({ where: { id: platformId, userId } });
    if (!platform) {
      res.status(404).json({ error: "Pick a platform to import under first." });
      return;
    }

    const txns = await prisma.statementTransaction.findMany({
      where: { id: { in: transactionIds }, statementId: req.params.id, isAccepted: false },
    });
    if (txns.length === 0) {
      res.status(400).json({ error: "Nothing left to accept in this selection." });
      return;
    }

    const statement = await prisma.bankStatement.findUnique({ where: { id: req.params.id } });
    if (!statement || statement.userId !== userId) {
      res.status(404).json({ error: "Statement not found." });
      return;
    }

    const now = new Date();
    const created = await prisma.$transaction(async (tx) => {
      // Reasonable defaults: entry date = txn date, deadline = FY end.
      const records = await Promise.all(
        txns.map((t) =>
          tx.incomeRecord.create({
            data: {
              userId,
              platformId,
              incomeAmount: t.amount,
              correspondingTax: 0,
              taxDeductionSource: "none",
              paymentStatus: "paid",
              receiptConfirmed: true, // bank credit is itself the proof
              workStartDate: t.txnDate ?? now,
              workEndDate: t.txnDate ?? now,
              taxPayDeadline: fyEndDate(now),
              clientName: t.counterparty ?? "Bank credit",
              source: "ocr_import",
              statementId: statement.id,
            },
          })
        )
      );
      await tx.statementTransaction.updateMany({
        where: { id: { in: txns.map((t) => t.id) } },
        data: { isAccepted: true },
      });
      await tx.platform.update({
        where: { id: platformId },
        data: { hasRecords: true },
      });
      return records;
    });

    res.status(201).json({ importedCount: created.length });
  } catch (err) {
    next(err);
  }
});

function fyEndDate(from: Date): Date {
  const y = from.getUTCFullYear();
  // Indian FY ends March 31; if we're past March, next FY end applies.
  const fyEnd = from.getUTCMonth() >= 3 ? new Date(Date.UTC(y + 1, 2, 31)) : new Date(Date.UTC(y, 2, 31));
  return fyEnd;
}

export default router;
