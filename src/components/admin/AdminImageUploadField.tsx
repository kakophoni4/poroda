"use client";

import { useRef } from "react";

type Props = {
  label: string;
  imageUrl: string;
  uploading: boolean;
  onImageUrlChange: (url: string) => void;
  onFileSelect: (file: File) => void;
  urlPlaceholder?: string;
  urlHint?: string;
};

export default function AdminImageUploadField({
  label,
  imageUrl,
  uploading,
  onImageUrlChange,
  onFileSelect,
  urlPlaceholder = "/images/... или полный URL",
  urlHint = "Если фото уже на сайте — вставьте путь, например /images/obshchie/hero.jpg",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <span className="block text-xs font-medium text-zinc-600">{label}</span>

      <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
          {uploading ? "Загрузка…" : "Загрузить фото с компьютера"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-zinc-500">JPG, PNG, WebP или GIF · до 10 МБ</p>
      </div>

      <p className="mt-3 text-xs font-medium text-zinc-600">Или ссылка на картинку</p>
      <p className="mt-0.5 text-xs text-zinc-500">{urlHint}</p>
      <input
        type="text"
        value={imageUrl}
        onChange={(e) => onImageUrlChange(e.target.value)}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        placeholder={urlPlaceholder}
      />

      {imageUrl && (
        /* eslint-disable-next-line @next/next/no-img-element -- превью по URL из формы */
        <img src={imageUrl} alt="" className="mt-2 max-h-32 w-full rounded-lg border object-cover" />
      )}
    </div>
  );
}
