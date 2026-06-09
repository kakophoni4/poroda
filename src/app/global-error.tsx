"use client";

/**
 * Отдельный root при фатальной ошибке (свои html/body, без Providers).
 * Нужен для стабильного prerender /_global-error в Next.js 16.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-zinc-100 font-sans text-zinc-900 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <h1 className="text-xl font-semibold">Ошибка приложения</h1>
          <p className="mt-2 max-w-md text-center text-sm text-zinc-600">
            {error.message || "Произошла непредвиденная ошибка. Попробуйте обновить страницу."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
