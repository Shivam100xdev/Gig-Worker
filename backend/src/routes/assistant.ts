import { Router } from "express";
import { z } from "zod";
import { requireSessionUser } from "../middleware/session.js";
import { geminiService, type ChatMessage, type AssistantContext } from "../services/geminiService.js";
import { prisma } from "../lib/prisma.js";
import { GST_REGISTRATION_THRESHOLD } from "../lib/taxConstants.js";

/**
 * POST /api/assistant/chat — the dashboard "Ask anything" widget.
 *
 * The backend injects the signed-in user's live ledger context (totals,
 * filing status, checklist state) into the system prompt so answers are
 * specific to their situation. Chat history is kept client-side; the
 * client sends the recent turns with each request (stateless server).
 */

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

router.post("/chat", async (req, res, next) => {
  
  try {
    // const { userId } = requireSessionUser(req);
    const { messages } = chatSchema.parse(req.body);
    
    // Build ledger context fresh each turn so advice reflects reality.
    // const [user, records] = await Promise.all([
    //   prisma.user.findUnique({ where: { id: userId } }),
    //   prisma.incomeRecord.findMany({ where: { userId }, select: { incomeAmount: true, correspondingTax: true, paymentStatus: true, receiptConfirmed: true } }),
    // ]);
    // if (!user) {
    //   res.status(401).json({ error: "Sign in to continue." });
    //   return;
    // }
    // const totalIncome = records.reduce((s, r) => s + Number(r.incomeAmount), 0);
    // const totalTaxPaid = records.reduce((s, r) => s + Number(r.correspondingTax), 0);
    // Rough slab estimate reused from the shared constants — a full
    // computeTax port lives in the filing route; this is context only.
    // const estimatedLiability = Math.round(totalIncome * 0.06);
    // const balance = estimatedLiability - totalTaxPaid;
    // const unconfirmed = records.filter((r) => r.paymentStatus === "paid" && !r.receiptConfirmed).length;

    const ctx: AssistantContext = {
      userName: null,
      totalIncome: null,
      totalTaxPaid : null,
      estimatedLiability: 100,
      balancePayable: null,
      filingStatus: "draft",
      hasPan: null,
      unconfirmedReceipts: null,
      turnoverOverGstThreshold: false //totalIncome > GST_REGISTRATION_THRESHOLD,
    };
    const reply = await geminiService.chat(messages as ChatMessage[],ctx);
    res.json({ reply });
  } catch (err) {
    console.log("error: ",err)
    next(err);
  }
});

export default router;
