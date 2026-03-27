import { parseMarketplaceUrl } from "@/lib/marketplace-links";

export type VideoPresentation =
  | { type: "youtube"; embedUrl: string }
  | { type: "vimeo"; embedUrl: string }
  | { type: "direct"; src: string }
  | { type: "unsupported"; pageUrl: string };

export function parseDermatologistVideoUrl(raw: unknown): string | null {
  return parseMarketplaceUrl(raw);
}

function youtubeIdFromUrl(u: URL): string | null {
  const h = u.hostname.replace(/^www\./, "");
  if (h === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id?.replace(/[^a-zA-Z0-9_-]/g, "") || null;
  }
  if (!h.includes("youtube.com") && !h.includes("youtube-nocookie.com")) return null;
  if (u.pathname.startsWith("/watch")) {
    const v = u.searchParams.get("v");
    return v?.replace(/[^a-zA-Z0-9_-]/g, "") || null;
  }
  if (u.pathname.startsWith("/embed/")) {
    const id = u.pathname.split("/")[2];
    return id?.replace(/[^a-zA-Z0-9_-]/g, "") || null;
  }
  if (u.pathname.startsWith("/shorts/")) {
    const id = u.pathname.split("/")[2];
    return id?.replace(/[^a-zA-Z0-9_-]/g, "") || null;
  }
  return null;
}

function vimeoIdFromUrl(u: URL): string | null {
  const h = u.hostname.replace(/^www\./, "");
  if (!h.includes("vimeo.com")) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const id = parts[0] === "video" ? parts[1] : parts[0];
  if (!id || !/^\d+$/.test(id)) return null;
  return id;
}

/** Определяет способ показа видео по URL (уже проверенному как https). */
export function getVideoPresentation(url: string): VideoPresentation {
  try {
    const u = new URL(url);
    const yid = youtubeIdFromUrl(u);
    if (yid) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${yid}?rel=0`,
      };
    }
    const vid = vimeoIdFromUrl(u);
    if (vid) {
      return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vid}` };
    }
    const path = u.pathname.toLowerCase();
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(path)) {
      return { type: "direct", src: url };
    }
  } catch {
    /* fallthrough */
  }
  return { type: "unsupported", pageUrl: url };
}
