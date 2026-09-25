import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { redisService } from "../services/redisService.js";

/** FAQs — Redis-cached 10 minutes; changes only when we edit seeds. */
const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const faqs = await redisService.cacheAside("faqs", 600, () =>
      prisma.faq.findMany({ orderBy: { sortOrder: "asc" } })
    );
    res.json({ faqs });
  } catch (err) {
    next(err);
  }
});

export default router;
