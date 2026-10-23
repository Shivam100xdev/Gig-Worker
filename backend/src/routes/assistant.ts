import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/authUse.js";
import { requireSessionUser } from "../middleware/session.js";
import { geminiService, type ChatMessage, type AssistantContext } from "../services/geminiService.js";
import { prisma } from "../lib/prisma.js";
import { GST_REGISTRATION_THRESHOLD, computeTaxBackend } from "../lib/taxConstants.js";

const router = Router();
const MAX_TURNS = 12; // keep context small & cheap

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(MAX_TURNS),
});

/**
 * AI tax assistant. Authenticated, and the ledger context is computed from
 * the signed-in user's actual DB rows instead of placeholder values.
 */
router.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const { messages } = chatSchema.parse(req.body);

    const [user, records, filings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.incomeRecord.findMany({ where: { userId } }),
      prisma.itrFiling.findMany({ where: { userId }, orderBy: { filedAt: "desc" }, take: 1 }),
    ]);

    const totalIncome = records.reduce((s, r) => s + Number(r.incomeAmount), 0);
    const totalTaxPaid = records.reduce((s, r) => s + Number(r.correspondingTax), 0);
    const computation = computeTaxBackend(totalIncome, totalTaxPaid);

    const ctx: AssistantContext = {
      userName: user?.name ?? null,
      totalIncome,
      totalTaxPaid,
      estimatedLiability: computation.totalTaxLiability,
      balancePayable: computation.balancePayable,
      filingStatus: filings[0]?.status ?? "draft",
      hasPan: Boolean(user?.pan),
      unconfirmedReceipts: records.filter((r) => r.paymentStatus === "paid" && !r.receiptConfirmed).length,
      turnoverOverGstThreshold: totalIncome > GST_REGISTRATION_THRESHOLD,
    };

    const reply = await geminiService.chat(messages as ChatMessage[], ctx);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

export default router;
