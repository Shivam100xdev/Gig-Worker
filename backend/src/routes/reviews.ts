import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireSessionUser } from "../middleware/session.js";
import { redisService } from "../services/redisService.js";

/**
 * Reviews wall — real reviews left by gig workers, Postgres-backed and
 * Redis-cached (2 min) since it's read-heavy and changes rarely.
 */

const router = Router();

const createSchema = z.object({
  rating: z.number().int().min(1).max(5),
  headline: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(2000),
  platformName: z.string().trim().max(80).optional(),
});

// Public: anyone can read the wall (cached).
router.get("/", async (_req, res, next) => {
  try {
    const reviews = await redisService.cacheAside("reviews", 120, async () => {
      const rows = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      });
      return rows.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        platformName: r.platformName,
        rating: r.rating,
        headline: r.headline,
        body: r.body,
        createdAt: r.createdAt,
      }));
    });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// Authed: a signed-in user can leave one.
router.post("/", async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const input = createSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const review = await prisma.review.create({
      data: {
        userId,
        displayName: user?.name?.trim() || "Gig worker",
        platformName: input.platformName,
        rating: input.rating,
        headline: input.headline,
        body: input.body,
      },
    });

    await redisService.invalidate("reviews");
    res.status(201).json({ review: { id: review.id } });
  } catch (err) {
    next(err);
  }
});

export default router;
