import { Router } from "express";
import { z } from "zod";
import { requireSessionUser } from "../middleware/session.js";
import { geminiService, type ChatMessage, type AssistantContext } from "../services/geminiService.js";
import { prisma } from "../lib/prisma.js";
import { GST_REGISTRATION_THRESHOLD } from "../lib/taxConstants.js";


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
