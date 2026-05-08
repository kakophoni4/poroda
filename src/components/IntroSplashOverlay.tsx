"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ParticleHero from "@/components/ParticleHero";

const SESSION_KEY = "poroda_intro_seen_v1";
const SPLASH_IMAGE = "/images/brand/intro-photo.png";
/** Пауза после завершения анимации, чтобы пользователь успел увидеть собранное фото. */
const HOLD_AFTER_MS = 550;
/** Длительность исчезновения оверлея после HOLD_AFTER_MS. */
const FADE_OUT_MS = 500;

export default function IntroSplashOverlay() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* private mode */
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      return;
    }

    setShow(true);
    setOverlayOpacity(1);

    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    };
  }, [pathname]);

  const handleDone = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      setOverlayOpacity(0);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
      unmountTimer.current = setTimeout(() => setShow(false), FADE_OUT_MS);
    }, HOLD_AFTER_MS);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-200 px-4 py-8 sm:px-8"
      style={{
        opacity: overlayOpacity,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        pointerEvents: overlayOpacity === 0 ? "none" : "auto",
      }}
      aria-hidden
    >
      <div className="relative block h-auto w-full max-w-[min(76vmin,720px,94vw)] aspect-square">
        <ParticleHero
          src={SPLASH_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full"
          fit="contain"
          onDone={handleDone}
        />
      </div>
    </div>
  );
}
