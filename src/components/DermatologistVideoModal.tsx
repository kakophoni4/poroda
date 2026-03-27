"use client";

import { useEffect, useState } from "react";
import { getVideoPresentation } from "@/lib/dermatologist-video";
import { useSiteCopy } from "@/context/SiteCopyContext";

function VideoBody({ url, t }: { url: string; t: (k: string) => string }) {
  const pres = getVideoPresentation(url);
  if (pres.type === "youtube" || pres.type === "vimeo") {
    return (
      <div className="relative aspect-video w-full max-h-[min(70vh,560px)] overflow-hidden rounded-xl bg-black">
        <iframe
          src={pres.embedUrl}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Видео дерматолога"
        />
      </div>
    );
  }
  if (pres.type === "direct") {
    return <video src={pres.src} controls className="max-h-[min(70vh,560px)] w-full rounded-xl bg-black" playsInline />;
  }
  return (
    <p className="text-sm text-zinc-600">
      {t("derma.unsupported_prefix")}{" "}
      <a href={pres.pageUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-zinc-900 underline">
        {t("derma.unsupported_link")}
      </a>
    </p>
  );
}

export default function DermatologistVideoModal({
  open,
  videoUrl,
  onClose,
}: {
  open: boolean;
  videoUrl: string;
  onClose: () => void;
}) {
  const t = useSiteCopy();
  const [phase, setPhase] = useState<"video" | "feedback">("video");

  useEffect(() => {
    if (open) setPhase("video");
  }, [open, videoUrl]);

  if (!open) return null;

  const goToFeedback = () => setPhase("feedback");
  const finish = () => {
    setPhase("video");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={t("aria.close")}
        onClick={phase === "video" ? goToFeedback : finish}
      />
      <div className="relative z-10 w-full max-w-3xl liquidGlass-dock rounded-2xl border border-white/50 p-4 shadow-xl sm:p-6">
        <button
          type="button"
          onClick={phase === "video" ? goToFeedback : finish}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/90 text-lg leading-none text-white hover:bg-zinc-800"
          aria-label={t("aria.close")}
        >
          ×
        </button>
        {phase === "video" ? (
          <div className="pt-1">
            <h2 className="mb-3 pr-10 text-base font-semibold text-zinc-900 sm:text-lg">{t("derma.modal_title")}</h2>
            <VideoBody url={videoUrl} t={t} />
          </div>
        ) : (
          <div className="py-4 sm:py-6">
            <p className="text-center text-base font-medium text-zinc-900">{t("derma.feedback_q")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={finish}
                className="min-h-[44px] rounded-xl bg-zinc-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                {t("derma.feedback_yes")}
              </button>
              <button
                type="button"
                onClick={finish}
                className="min-h-[44px] rounded-xl border-2 border-zinc-300 px-8 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                {t("derma.feedback_no")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
