import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { SITE_COPY_DEFAULTS_MAP, SITE_COPY_SCHEMA } from "@/lib/site-copy-schema";

const allowedKeys = new Set(SITE_COPY_SCHEMA.map((x) => x.key));

async function loadMergedSiteCopy(): Promise<Record<string, string>> {
  const map: Record<string, string> = { ...SITE_COPY_DEFAULTS_MAP };
  try {
    const rows = await prisma.siteCopy.findMany();
    for (const r of rows) {
      if (!allowedKeys.has(r.key)) continue;
      if (r.value.trim() !== "") map[r.key] = r.value;
    }
  } catch {
    /* БД недоступна — только дефолты */
  }
  return map;
}

const cachedMerged = unstable_cache(loadMergedSiteCopy, ["site-copy-merged-v1"], {
  tags: ["site-copy"],
  revalidate: 300,
});

/** Слияние дефолтов и БД; кэш + dedupe в рамках одного запроса RSC */
export const getSiteCopyMap = cache(async () => cachedMerged());
