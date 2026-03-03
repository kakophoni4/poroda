import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Конфиг для pg: для Supabase включаем SSL без проверки сертификата (избегаем "self-signed certificate"). */
function getPoolConfig(): { connectionString: string; ssl?: { rejectUnauthorized: false } } {
  loadEnv({ path: path.join(process.cwd(), ".env") });
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:qwe@localhost:5432/poroda";
  const needsSsl = (connectionString.includes("supabase") || connectionString.includes("pooler.")) && !connectionString.includes("sslmode=");
  return needsSsl ? { connectionString, ssl: { rejectUnauthorized: false } } : { connectionString };
}

function createPrisma(): PrismaClient {
  const adapter = new PrismaPg(getPoolConfig());
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  globalForPrisma.prisma = createPrisma();
  return globalForPrisma.prisma;
}

// Ленивая инициализация: клиент создаётся при первом обращении (когда Next уже подгрузил .env)
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    return (getPrisma() as unknown as Record<string, unknown>)[prop];
  },
});
