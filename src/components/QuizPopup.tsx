"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSiteCopy } from "@/context/SiteCopyContext";

const QUIZ_DISMISS_KEY = "quizPopupDismissed";
const QUIZ_DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 часа
const QUIZ_IDLE_MS = 3 * 60 * 1000; // 3 минуты без действий
/** Не вызывать сброс таймера чаще (mousemove и т.д.) */
const ACTIVITY_THROTTLE_MS = 750;

type QuizAnswer = { id: string; label: string; linkUrl: string; nextQuestionId: string | null };
type QuizQuestion = { id: string; title: string; sortOrder: number; answers: QuizAnswer[] };

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(QUIZ_DISMISS_KEY);
    if (!raw) return false;
    const t = parseInt(raw, 10);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < QUIZ_DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(QUIZ_DISMISS_KEY, String(Date.now()));
  } catch {}
}

const QUIZ_PANEL_MS = 300;

const IDLE_EVENTS = ["keydown", "pointerdown", "scroll", "touchstart", "wheel", "mousemove"] as const;

export default function QuizPopup() {
  const t = useSiteCopy();
  const pathname = usePathname();
  const shouldTrackIdle = Boolean(pathname && !pathname.startsWith("/admin"));

  const [visible, setVisible] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [overlayIn, setOverlayIn] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(false);
  const scheduleIdleRef = useRef<() => void>(() => {});
  const lastActivityBumpRef = useRef(0);
  const hadModalOpenRef = useRef(false);
  const quizOpenedAnimRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  /** На админке не крутим квиз и закрываем окно при переходе */
  useEffect(() => {
    if (!shouldTrackIdle && visible) setVisible(false);
  }, [shouldTrackIdle, visible]);

  useEffect(() => {
    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const tryOpenAfterIdle = () => {
      idleTimerRef.current = null;
      if (!shouldTrackIdle || visibleRef.current || isDismissed()) return;
      fetch("/api/quiz")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: QuizQuestion[]) => {
          if (!Array.isArray(data) || data.length === 0) return;
          const first = data[0];
          if (!first?.answers?.length) return;
          if (visibleRef.current || isDismissed()) return;
          setQuestions(data);
          setCurrentQuestion(first);
          visibleRef.current = true;
          setVisible(true);
        })
        .catch(() => {});
    };

    const scheduleIdleTimer = () => {
      clearIdleTimer();
      if (!shouldTrackIdle || visibleRef.current || isDismissed()) return;
      idleTimerRef.current = setTimeout(tryOpenAfterIdle, QUIZ_IDLE_MS);
    };

    const onUserActivity = () => {
      if (!shouldTrackIdle || visibleRef.current || isDismissed()) return;
      const now = Date.now();
      if (now - lastActivityBumpRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityBumpRef.current = now;
      scheduleIdleTimer();
    };

    scheduleIdleRef.current = scheduleIdleTimer;

    if (!shouldTrackIdle || isDismissed()) {
      clearIdleTimer();
      return clearIdleTimer;
    }

    scheduleIdleTimer();

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    for (const ev of IDLE_EVENTS) {
      window.addEventListener(ev, onUserActivity, opts);
    }

    return () => {
      for (const ev of IDLE_EVENTS) {
        window.removeEventListener(ev, onUserActivity, opts);
      }
      clearIdleTimer();
    };
  }, [shouldTrackIdle]);

  /** Пока окно открыто — таймер бездействия не нужен; после закрытия — снова отсчёт 3 мин */
  useEffect(() => {
    if (visible) {
      hadModalOpenRef.current = true;
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }
    if (hadModalOpenRef.current) {
      hadModalOpenRef.current = false;
      if (shouldTrackIdle && !isDismissed()) {
        scheduleIdleRef.current();
      }
    }
  }, [visible, shouldTrackIdle]);

  useLayoutEffect(() => {
    if (visible && currentQuestion) setOverlayMounted(true);
  }, [visible, currentQuestion]);

  useEffect(() => {
    if (!visible) {
      quizOpenedAnimRef.current = false;
      setOverlayIn(false);
      const t = window.setTimeout(() => setOverlayMounted(false), QUIZ_PANEL_MS);
      return () => window.clearTimeout(t);
    }
    if (!currentQuestion) return;
    if (quizOpenedAnimRef.current) {
      setOverlayIn(true);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        quizOpenedAnimRef.current = true;
        setOverlayIn(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [visible, currentQuestion]);

  useEffect(() => {
    if (!overlayMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlayMounted]);

  useEffect(() => {
    if (!overlayMounted || !overlayIn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDismissed();
        visibleRef.current = false;
        setVisible(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayMounted, overlayIn]);

  const handleClose = () => {
    setDismissed();
    visibleRef.current = false;
    setVisible(false);
  };

  const handleAnswer = (answer: QuizAnswer) => {
    if (answer.nextQuestionId) {
      const next = questions.find((q) => q.id === answer.nextQuestionId);
      if (next?.answers?.length) {
        setCurrentQuestion(next);
        return;
      }
    }
    if (answer.linkUrl?.trim()) {
      window.location.href = answer.linkUrl.trim();
      return;
    }
    handleClose();
  };

  if (!currentQuestion) return null;
  if (!visible && !overlayMounted) return null;

  const answerBtnClass =
    "min-h-[3rem] w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-center text-sm font-medium leading-snug text-zinc-900 transition-[border-color,background-color,transform] duration-200 ease-out hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] sm:min-h-[3.25rem] sm:px-4";
  const cellW = "w-[calc((100%-0.5rem)/2)] max-w-[calc((100%-0.5rem)/2)]";

  const shellTransition =
    "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-opacity motion-reduce:duration-200";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-[2px] transition-colors duration-300 ease-out motion-reduce:transition-none ${
        overlayIn ? "bg-black/45" : "bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!overlayIn}
      aria-labelledby="quiz-title"
    >
      <button
        type="button"
        className={`fixed inset-0 z-0 cursor-default transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          overlayIn ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label={t("aria.close")}
        tabIndex={-1}
        onClick={handleClose}
      />
      <div
        className={`relative z-10 my-8 w-[min(100%,28rem)] max-w-md rounded-2xl bg-white p-6 shadow-xl will-change-transform ${shellTransition} ${
          overlayIn
            ? "translate-y-0 scale-100 opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100"
            : "pointer-events-none translate-y-4 scale-[0.96] opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="quiz-title" className="text-lg font-semibold leading-snug text-zinc-900">
            {t("quiz.shell_title")}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1 text-zinc-500 transition-[background-color,color,transform] duration-200 ease-out hover:bg-zinc-100 hover:text-zinc-700 active:scale-95"
            aria-label={t("aria.close")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-600">{currentQuestion.title}</p>
        <div
          className={`mt-4 grid gap-2 ${currentQuestion.answers.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {currentQuestion.answers.map((a, i) => {
            const n = currentQuestion.answers.length;
            const lastOdd = n % 2 === 1 && i === n - 1;
            if (lastOdd) {
              return (
                <div key={a.id} className="col-span-2 flex justify-center">
                  <button type="button" onClick={() => handleAnswer(a)} className={`${answerBtnClass} ${cellW}`}>
                    {a.label}
                  </button>
                </div>
              );
            }
            return (
              <button key={a.id} type="button" onClick={() => handleAnswer(a)} className={answerBtnClass}>
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
