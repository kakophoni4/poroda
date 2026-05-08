import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/rate-limit";
import { sanitizePageViewReferrer } from "@/lib/sanitize-referrer";

function readPageViewBody(body: unknown): {
  page: string;
  productId: string | null;
  referrer: string | null;
} | null {
  if (body === null || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const pageRaw = b.page;
  const pathRaw = b.path;
  const page =
    typeof pageRaw === "string" && pageRaw.length > 0
      ? pageRaw
      : typeof pathRaw === "string" && pathRaw.length > 0
        ? pathRaw
        : null;
  if (page == null) return null;

  const productId = typeof b.productId === "string" && b.productId.length > 0 ? b.productId : null;
  const refRaw = b.referrer;
  const referrer = typeof refRaw === "string" && refRaw.length > 0 ? refRaw : null;

  return { page, productId, referrer: sanitizePageViewReferrer(referrer) };
}

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const session = await getUserSession();
  const userId = session?.userId ?? null;
  const ipHash = hashIp(request);

  try {
    const raw = (await request.json()) as unknown;
    const parsed = readPageViewBody(raw);
    if (!parsed) return NextResponse.json({ ok: false }, { status: 400 });

    let safeProductId: string | null = null;
    if (parsed.productId) {
      const exists = await prisma.product.findUnique({ where: { id: parsed.productId }, select: { id: true } });
      if (exists) safeProductId = parsed.productId;
    }

    await prisma.pageView.create({
      data: {
        path: parsed.page.slice(0, 500),
        productId: safeProductId,
        referrer: parsed.referrer,
        userId,
        ipHash,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("PageView (запись пропущена):", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true });
  }
}
