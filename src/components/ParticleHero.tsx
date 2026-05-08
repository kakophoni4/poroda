"use client";

import { useEffect, useRef, useState } from "react";

type Particle = {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  r: number;
  g: number;
  b: number;
  jitterKx: number;
  jitterKy: number;
};

function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const ALPHA_IN_MS_RATIO = 0.4;
const CANVAS_FADE_MS = 300;
const SPAWN_MARGIN = 0.4;
const MAX_ALPHA_8 = 10;

const DURATION_DEFAULT_MS = 2800;
const DURATION_MOBILE_MS = 2000;
const MOBILE_BP = 640;
const JITTER_AMP = 0.8;
const JITTER_PROGRESS_START = 0.85;
const DESKTOP_SAMPLE = 4;
const MOBILE_SAMPLE = 6;

function drawImageFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destW: number,
  destH: number,
  fit: "cover" | "contain"
): void {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw === 0 || ih === 0) return;
  const scale =
    fit === "cover" ? Math.max(destW / iw, destH / ih) : Math.min(destW / iw, destH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (destW - dw) / 2;
  const dy = (destH - dh) / 2;
  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
}

function buildParticles(w: number, h: number, sample: number, imageData: ImageData): Particle[] {
  const particles: Particle[] = [];
  const data = imageData.data;
  const idw = imageData.width;
  const idh = imageData.height;
  for (let sy = 0; sy < h; sy += sample) {
    for (let sx = 0; sx < w; sx += sample) {
      const ix = Math.min(Math.floor((sx + sample / 2) * (idw / w)), idw - 1);
      const iy = Math.min(Math.floor((sy + sample / 2) * (idh / h)), idh - 1);
      const o = (iy * idw + ix) * 4;
      const a = data[o + 3] ?? 0;
      if (a < MAX_ALPHA_8) continue;
      const targetX = sx;
      const targetY = sy;
      const startX = -SPAWN_MARGIN * w + Math.random() * (1 + 2 * SPAWN_MARGIN) * w;
      const startY = -SPAWN_MARGIN * h + Math.random() * (1 + 2 * SPAWN_MARGIN) * h;
      particles.push({
        startX,
        startY,
        targetX,
        targetY,
        r: data[o]!,
        g: data[o + 1]!,
        b: data[o + 2]!,
        jitterKx: (Math.random() * 2 - 1) * JITTER_AMP,
        jitterKy: (Math.random() * 2 - 1) * JITTER_AMP,
      });
    }
  }
  return particles;
}

function isElementInViewport(node: Element): boolean {
  const r = node.getBoundingClientRect();
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
}

type ParticleHeroProps = {
  src: string;
  alt: string;
  className?: string;
  /** object-fit для финального изображения и сбора частиц. По умолчанию "cover". */
  fit?: "cover" | "contain";
  /** Вызывается, когда анимация полностью завершена (включая fade-out canvas). */
  onDone?: () => void;
};

export default function ParticleHero({
  src,
  alt,
  className = "",
  fit = "cover",
  onDone,
}: ParticleHeroProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [done, setDone] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);
  const [canvasOpacity, setCanvasOpacity] = useState(1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runIdRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const t0Ref = useRef(0);
  const startedRef = useRef(false);
  const imageReadyRef = useRef(false);
  const inViewRef = useRef(false);
  const animDoneRef = useRef(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === "undefined") return;

    const runId = ++runIdRef.current;
    setDone(false);
    setShowCanvas(true);
    setCanvasOpacity(1);

    let outerCancelled = false;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    let bootRaf = 0;
    const innerCleanup: { c: (() => void) | null } = { c: null };

    const start = () => {
      if (outerCancelled || runIdRef.current !== runId) return;
      const scheduleMain = (attempt: number) => {
        if (outerCancelled || runIdRef.current !== runId) return;
        const el = containerRef.current;
        const canvas = canvasRef.current;
        if (!el || !canvas) {
          if (attempt < 32) {
            bootRaf = requestAnimationFrame(() => scheduleMain(attempt + 1));
          }
          return;
        }

    let cancelled = false;
    let tickRaf = 0;
    const img = new window.Image();
    let imgTouched = false;
    const cancelImg = () => {
      if (!imgTouched) return;
      imgTouched = false;
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
    };

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let wCss = 0;
    let hCss = 0;
    let durationMs = DURATION_DEFAULT_MS;
    let sample = DESKTOP_SAMPLE;
    let imgLoadHandled = false;

    const ctxMain = canvas.getContext("2d", { alpha: true });
    if (!ctxMain) {
      return;
    }

    t0Ref.current = 0;
    imageReadyRef.current = false;
    startedRef.current = false;
    animDoneRef.current = false;

    const isMobile = () => window.innerWidth < MOBILE_BP;

    const getSettings = () => {
      if (isMobile()) {
        return { sample: MOBILE_SAMPLE, durationMs: DURATION_MOBILE_MS } as const;
      }
      return { sample: DESKTOP_SAMPLE, durationMs: DURATION_DEFAULT_MS } as const;
    };

    const tryStartClock = () => {
      if (runIdRef.current !== runId || cancelled) return;
      if (!imageReadyRef.current) return;
      if (!inViewRef.current) return;
      if (t0Ref.current > 0) return;
      t0Ref.current = performance.now();
    };

    const layoutSize = () => {
      if (runIdRef.current !== runId || cancelled) return;
      const r = el.getBoundingClientRect();
      wCss = Math.max(1, Math.floor(r.width));
      hCss = Math.max(1, Math.floor(r.height));
    };

    const resample = () => {
      if (runIdRef.current !== runId || cancelled) return;
      if (wCss < 2 || hCss < 2) return;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const s = getSettings();
      sample = s.sample;
      durationMs = s.durationMs;
      if (img.naturalWidth < 1 || img.naturalHeight < 1) return;

      const offW = Math.floor(wCss * dpr);
      const offH = Math.floor(hCss * dpr);
      if (offW < 1 || offH < 1) return;

      const off = document.createElement("canvas");
      off.width = offW;
      off.height = offH;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.setTransform(1, 0, 0, 1, 0, 0);
      octx.scale(dpr, dpr);
      drawImageFit(octx, img, wCss, hCss, fit);
      const imageData = octx.getImageData(0, 0, offW, offH);
      particlesRef.current = buildParticles(wCss, hCss, sample, imageData);

      canvas.width = offW;
      canvas.height = offH;
      canvas.style.width = `${wCss}px`;
      canvas.style.height = `${hCss}px`;
    };

    const finishAnim = () => {
      if (runIdRef.current !== runId || cancelled) return;
      if (animDoneRef.current) return;
      animDoneRef.current = true;
      setDone(true);
      setCanvasOpacity(0);
      window.setTimeout(() => {
        if (runIdRef.current !== runId || cancelled) return;
        setShowCanvas(false);
        onDone?.();
      }, CANVAS_FADE_MS);
    };

    const onImgReady = (ok: boolean) => {
      if (runIdRef.current !== runId || cancelled) return;
      if (imgLoadHandled) return;
      imgLoadHandled = true;
      if (!ok) {
        animDoneRef.current = true;
        setDone(true);
        setShowCanvas(false);
        setCanvasOpacity(0);
        return;
      }
      startedRef.current = true;
      imageReadyRef.current = true;
      animDoneRef.current = false;
      t0Ref.current = 0;
      setDone(false);
      setShowCanvas(true);
      setCanvasOpacity(1);
      layoutSize();
      resample();
      if (particlesRef.current.length === 0) {
        finishAnim();
        return;
      }
      tryStartClock();
    };

    const tick = (now: number) => {
      if (runIdRef.current !== runId || cancelled) return;
      if (animDoneRef.current) return;

      if (!inViewRef.current || !startedRef.current || !imageReadyRef.current) {
        tickRaf = requestAnimationFrame(tick);
        return;
      }
      if (t0Ref.current <= 0) {
        tickRaf = requestAnimationFrame(tick);
        return;
      }

      const w = wCss;
      const h = hCss;
      if (w < 2 || h < 2) {
        tickRaf = requestAnimationFrame(tick);
        return;
      }

      const pList = particlesRef.current;
      const t0 = t0Ref.current;
      const elapsed = now - t0;
      const tNorm = Math.min(1, durationMs > 0 ? elapsed / durationMs : 1);
      const p = easeOutCubic(tNorm);
      const alphaT = Math.min(
        1,
        durationMs * ALPHA_IN_MS_RATIO > 0 ? elapsed / (durationMs * ALPHA_IN_MS_RATIO) : 1
      );

      let wobbleK = 0;
      if (p >= JITTER_PROGRESS_START) {
        wobbleK = 1 - (p - JITTER_PROGRESS_START) / (1 - JITTER_PROGRESS_START);
        if (wobbleK < 0) wobbleK = 0;
      }

      const ctx2 = ctxMain;
      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = pList.length;
      for (let i = 0; i < n; i++) {
        const pt = pList[i]!;
        let x = lerp(pt.startX, pt.targetX, p);
        let y = lerp(pt.startY, pt.targetY, p);
        if (wobbleK > 0) {
          x += pt.jitterKx * wobbleK;
          y += pt.jitterKy * wobbleK;
        }
        ctx2.globalAlpha = alphaT;
        ctx2.fillStyle = `rgb(${pt.r},${pt.g},${pt.b})`;
        ctx2.fillRect(x, y, 1, 1);
      }
      ctx2.globalAlpha = 1;

      if (p >= 1) {
        finishAnim();
        return;
      }
      tickRaf = requestAnimationFrame(tick);
    };

    inViewRef.current = isElementInViewport(el);
    if (inViewRef.current) tryStartClock();

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        inViewRef.current = e.isIntersecting;
        if (e.isIntersecting) {
          tryStartClock();
        }
      },
      { root: null, threshold: 0, rootMargin: "0px" }
    );
    io.observe(el);

    const ro = new ResizeObserver(() => {
      if (runIdRef.current !== runId || cancelled) return;
      if (!imageReadyRef.current) {
        layoutSize();
        return;
      }
      if (animDoneRef.current) return;
      if (!img.complete || !startedRef.current) {
        layoutSize();
        return;
      }
      const prevW = wCss;
      const prevH = hCss;
      layoutSize();
      if (wCss !== prevW || hCss !== prevH) {
        t0Ref.current = 0;
        resample();
        t0Ref.current = performance.now();
        if (particlesRef.current.length === 0) {
          finishAnim();
        }
      }
    });
    ro.observe(el);

    imgTouched = true;
    img.decoding = "async";
    img.loading = "eager";
    img.onload = () => onImgReady(true);
    img.onerror = () => onImgReady(false);
    img.src = src;

    layoutSize();

    tickRaf = requestAnimationFrame(tick);
    if (img.complete) {
      if (img.naturalWidth > 0) {
        onImgReady(true);
      } else {
        onImgReady(false);
      }
    }

    innerCleanup.c = () => {
      cancelled = true;
      cancelAnimationFrame(tickRaf);
      ro.disconnect();
      io.disconnect();
      cancelImg();
      startedRef.current = false;
      imageReadyRef.current = false;
    };
  };

  scheduleMain(0);
  };

  startTimer = setTimeout(start, 0);

  return () => {
    outerCancelled = true;
    if (startTimer !== undefined) {
      clearTimeout(startTimer);
    }
    cancelAnimationFrame(bootRaf);
    innerCleanup.c?.();
  };
  }, [reduceMotion, src, fit, onDone]);

  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  if (reduceMotion) {
    // eslint-disable-next-line @next/next/no-img-element -- LCP hero, static path; reduced motion
    return (
      <img src={src} alt={alt} className={`${className} ${fitClass}`.trim()} loading="eager" decoding="async" />
    );
  }

  return (
    <div ref={containerRef} className={`${className} min-h-0 min-w-0`.trim()}>
      {showCanvas ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{
            opacity: canvasOpacity,
            transition: `opacity ${CANVAS_FADE_MS}ms ease-out`,
            pointerEvents: "none",
          }}
          aria-hidden
        />
      ) : null}
      {done ? (
        // eslint-disable-next-line @next/next/no-img-element -- static hero, known path
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full ${fitClass}`}
          loading="eager"
          decoding="sync"
        />
      ) : null}
    </div>
  );
}
