"use client";

import { useMemo, useState, useCallback } from "react";
import type { SiteCopySchemaItem } from "@/lib/site-copy-schema";
import { SITE_COPY_DEFAULTS_MAP, SITE_COPY_SCHEMA } from "@/lib/site-copy-schema";

function groupBySection(items: SiteCopySchemaItem[]): Map<string, SiteCopySchemaItem[]> {
  const m = new Map<string, SiteCopySchemaItem[]>();
  for (const item of items) {
    const list = m.get(item.section) ?? [];
    list.push(item);
    m.set(item.section, list);
  }
  return m;
}

export default function AdminSiteCopyClient({ initialMap }: { initialMap: Record<string, string> }) {
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...initialMap }));
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const grouped = useMemo(() => groupBySection(SITE_COPY_SCHEMA), []);

  const filteredSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return grouped;
    const next = new Map<string, SiteCopySchemaItem[]>();
    for (const [section, items] of grouped) {
      const hit = items.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.defaultValue.toLowerCase().includes(q) ||
          section.toLowerCase().includes(q)
      );
      if (hit.length) next.set(section, hit);
    }
    return next;
  }, [grouped, filter]);

  const update = useCallback((key: string, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const resetKey = useCallback((key: string) => {
    const def = SITE_COPY_DEFAULTS_MAP[key] ?? "";
    setDraft((d) => ({ ...d, [key]: def }));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const entries: Record<string, string> = {};
      for (const item of SITE_COPY_SCHEMA) {
        entries[item.key] = draft[item.key] ?? SITE_COPY_DEFAULTS_MAP[item.key] ?? "";
      }
      const res = await fetch("/api/admin/site-copy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage(j.error || "Ошибка сохранения");
        return;
      }
      setMessage("Сохранено. Изменения появятся на сайте в течение минуты (кэш).");
    } finally {
      setSaving(false);
    }
  };

  const sectionOrder = useMemo(() => Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b, "ru")), [grouped]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Тексты сайта</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Все подписи кнопок, заголовки блоков и короткие тексты интерфейса. Пустое поле при сохранении сбрасывает текст к
        значению по умолчанию. Ключи внизу подсказки — для разработки.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Поиск по разделу, ключу, описанию…"
          className="min-w-[200px] flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить всё"}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}

      <div className="mt-8 space-y-6">
        {sectionOrder.map((section) => {
          const items = filteredSections.get(section);
          if (!items?.length) return null;
          return (
            <details
              key={section}
              open={!!filter.trim()}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4"
            >
              <summary className="cursor-pointer text-base font-semibold text-zinc-900">
                {section}{" "}
                <span className="text-sm font-normal text-zinc-500">({items.length})</span>
              </summary>
              <div className="mt-4 space-y-5">
                {items.map((item) => {
                  const val = draft[item.key] ?? item.defaultValue;
                  const rows = Math.min(16, Math.max(2, Math.ceil(val.length / 72) + 1));
                  return (
                    <div key={item.key} className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{item.description}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">{item.key}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => resetKey(item.key)}
                          className="shrink-0 text-xs text-zinc-500 underline hover:text-zinc-800"
                        >
                          К умолчанию
                        </button>
                      </div>
                      <textarea
                        value={val}
                        onChange={(e) => update(item.key, e.target.value)}
                        rows={rows}
                        className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm leading-relaxed"
                        spellCheck
                      />
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
