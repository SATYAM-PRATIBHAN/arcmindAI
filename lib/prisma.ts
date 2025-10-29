import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = global as unknown as { db: PrismaClient };

export const db =
  globalForPrisma.db ||
  new PrismaClient({
    log: ["error", "warn"], // optional: add "query" for debugging
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
