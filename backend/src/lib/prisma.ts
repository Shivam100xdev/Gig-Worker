import { PrismaClient } from "@prisma/client";

/** Single Prisma client shared by the whole backend. */
export const prisma = new PrismaClient();
