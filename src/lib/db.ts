import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Конфиг для pg: SSL для Supabase; для удалённой БД — таймаут подключения. */
function getPoolConfig(): { connectionString: string; ssl?: { rejectUnauthorized: false }; connectionTimeoutMillis?: number } {
  loadEnv({ path: path.join(process.cwd(), ".env") });
  let connectionString =
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:qwe@localhost:5432/poroda";
  const isRemote = !/localhost|127\.0\.0\.1/.test(connectionString);
  if (isRemote && !connectionString.includes("connect_timeout=")) {
    const sep = connectionString.includes("?") ? "&" : "?";
    connectionString = `${connectionString}${sep}connect_timeout=25`;
  }
  const needsSsl = (connectionString.includes("supabase") || connectionString.includes("pooler.")) && !connectionString.includes("sslmode=");
  const config: { connectionString: string; ssl?: { rejectUnauthorized: false }; connectionTimeoutMillis?: number } = needsSsl
    ? { connectionString, ssl: { rejectUnauthorized: false } }
    : { connectionString };
  if (isRemote) config.connectionTimeoutMillis = 25000;
  return config;
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
    const client = getPrisma() as unknown as Record<string, unknown>;
    const value = client[prop];
    // Если делегат модели отсутствует (устаревший кэш после prisma generate), сбрасываем кэш
    if (value === undefined && typeof prop === "string" && /^[a-z]/.test(prop)) {
      delete (globalForPrisma as { prisma?: PrismaClient }).prisma;
      const fresh = getPrisma() as unknown as Record<string, unknown>;
      return fresh[prop];
    }
    return value;
  },
});
