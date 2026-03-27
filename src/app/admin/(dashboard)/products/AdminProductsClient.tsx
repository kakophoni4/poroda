"use client";

import { useState } from "react";
import type { Product, Category } from "@prisma/client";
import { parseResearchLinks } from "@/lib/product-detail";
import { MAX_PRODUCT_TITLE_LENGTH } from "@/lib/product-title";

type ProductWithCat = Product & { category: Category };

const emptyForm = (): {
  slug: string;
  title: string;
  shortDesc: string;
  categoryId: string;
  price: number;
  oldPrice: number | "";
  isNew: boolean;
  skinTypes: string;
  imageUrl: string;
  imageUrls: string[];
  imageFocusX: number;
  imageFocusY: number;
  composition: string;
  components: string;
  extraField1: string;
  extraField2: string;
  featuredSortOrder: number | "";
  articleCode: string;
  problemText: string;
  careStageText: string;
  skinTypesLine: string;
  scientistsTitle: string;
  researchItems: { label: string; url: string }[];
  forWhatText: string;
  howItWorksRaw: string;
  howToUseText: string;
  inciText: string;
  volumeText: string;
  shelfLifeText: string;
  countryText: string;
  inStock: boolean;
  isPromo: boolean;
  isBestseller: boolean;
  linkWildberries: string;
  linkOzon: string;
  linkYandexMarket: string;
  dermatologistVideoUrl: string;
} => ({
  slug: "",
  title: "",
  shortDesc: "",
  categoryId: "",
  price: 0,
  oldPrice: "" as number | "",
  isNew: false,
  isPromo: false,
  isBestseller: false,
  skinTypes: "",
  imageUrl: "",
  imageUrls: [],
  imageFocusX: 50,
  imageFocusY: 50,
  composition: "",
  components: "",
  extraField1: "",
  extraField2: "",
  featuredSortOrder: "",
  articleCode: "",
  problemText: "",
  careStageText: "",
  skinTypesLine: "",
  scientistsTitle: "Что говорят ученые?",
  researchItems: [{ label: "", url: "" }],
  forWhatText: "",
  howItWorksRaw: "",
  howToUseText: "",
  inciText: "",
  volumeText: "",
  shelfLifeText: "",
  countryText: "",
  inStock: true,
  linkWildberries: "",
  linkOzon: "",
  linkYandexMarket: "",
  dermatologistVideoUrl: "",
});

function ProductForm({
  form,
  setForm,
  categories,
  onSave,
  onCancel,
  title,
  saveLabel,
}: {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
  title: string;
  saveLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600">URL slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="gel-umyvanie"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">
              Название <span className="font-normal text-zinc-400">(до {MAX_PRODUCT_TITLE_LENGTH} символов)</span>
            </label>
            <input
              value={form.title}
              maxLength={MAX_PRODUCT_TITLE_LENGTH}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value.slice(0, MAX_PRODUCT_TITLE_LENGTH) }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <p className="mt-0.5 text-right text-[11px] text-zinc-400">
              {form.title.length}/{MAX_PRODUCT_TITLE_LENGTH}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Описание</label>
            <input
              value={form.shortDesc}
              onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Категория</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">— выбрать —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Цена (₽)</label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Пред. цена (акция)</label>
              <input
                type="number"
                value={form.oldPrice}
                onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="не задана"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Фото продукции</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files?.length) return;
                    for (let i = 0; i < files.length; i++) {
                      const fd = new FormData();
                      fd.set("file", files[i]);
                      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                      if (res.ok) {
                        const { url } = await res.json();
                        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
                      }
                    }
                    e.target.value = "";
                  }}
                />
                <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v12a2 2 0 002 2h12a2 2 0 002-2V16m-8-4l4-4m0 0l4 4m-4-4v12" /></svg>
                <span>Загрузить файл</span>
              </label>
            </div>
            {form.imageUrls.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-zinc-600 mb-1">Точка фокуса главного фото (как будет обрезаться в каталоге)</p>
                <p className="text-[11px] text-zinc-500 mb-2">Кликни по превью — эта точка будет в центре карточки</p>
                <div
                  className="relative aspect-square w-full max-w-[220px] cursor-crosshair overflow-hidden rounded-xl border-2 border-zinc-200 bg-zinc-100"
                  onClick={(e) => {
                    const t = e.currentTarget;
                    const rect = t.getBoundingClientRect();
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                    setForm((f) => ({ ...f, imageFocusX: Math.max(0, Math.min(100, x)), imageFocusY: Math.max(0, Math.min(100, y)) }));
                  }}
                >
                  <img
                    src={form.imageUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${form.imageFocusX}% ${form.imageFocusY}%` }}
                    draggable={false}
                  />
                  <div
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border-2 border-white shadow-lg bg-amber-500/80"
                    style={{ left: `${form.imageFocusX}%`, top: `${form.imageFocusY}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">Фокус: {form.imageFocusX}%, {form.imageFocusY}%</p>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-start gap-2">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-zinc-200" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, j) => j !== i) })); }}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                      title="Удалить фото"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" /></svg>
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => setForm((prev) => {
                        const urls = [...prev.imageUrls];
                        [urls[i - 1], urls[i]] = [urls[i], urls[i - 1]];
                        return { ...prev, imageUrls: urls };
                      })}
                      className="rounded bg-zinc-100 p-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200"
                      title="Поднять выше"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      type="button"
                      disabled={i === form.imageUrls.length - 1}
                      onClick={() => setForm((prev) => {
                        const urls = [...prev.imageUrls];
                        [urls[i], urls[i + 1]] = [urls[i + 1], urls[i]];
                        return { ...prev, imageUrls: urls };
                      })}
                      className="rounded bg-zinc-100 p-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200"
                      title="Опустить ниже"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Состав</label>
            <textarea
              value={form.composition}
              onChange={(e) => setForm((f) => ({ ...f, composition: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Компоненты</label>
            <textarea
              value={form.components}
              onChange={(e) => setForm((f) => ({ ...f, components: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Доп. поле 1</label>
            <input
              value={form.extraField1}
              onChange={(e) => setForm((f) => ({ ...f, extraField1: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Доп. поле 2</label>
            <input
              value={form.extraField2}
              onChange={(e) => setForm((f) => ({ ...f, extraField2: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
              />
              <span className="text-sm">Новинка</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPromo}
                onChange={(e) => setForm((f) => ({ ...f, isPromo: e.target.checked }))}
              />
              <span className="text-sm">Акции</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isBestseller}
                onChange={(e) => setForm((f) => ({ ...f, isBestseller: e.target.checked }))}
              />
              <span className="text-sm">Бестселлер</span>
            </label>
          </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Типы кожи (через запятую)</label>
            <input
              value={form.skinTypes}
              onChange={(e) => setForm((f) => ({ ...f, skinTypes: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Порядок на главной</label>
            <input
              type="number"
              min={0}
              value={form.featuredSortOrder === "" ? "" : form.featuredSortOrder}
              onChange={(e) => setForm((f) => ({ ...f, featuredSortOrder: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0) }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Пусто — не показывать; 1, 2, 3… — порядок в блоке «Рекомендуемое»"
            />
          </div>

          <hr className="my-4 border-zinc-200" />
          <p className="text-sm font-semibold text-zinc-800">Карточка в каталоге (как на странице продукции)</p>
          <p className="text-xs text-zinc-500">Цена и «В корзину» — сверху. Ниже — блоки «Для чего?», исследования, состав и т.д.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Артикул</label>
              <input
                value={form.articleCode}
                onChange={(e) => setForm((f) => ({ ...f, articleCode: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="SP2081"
              />
            </div>
            <label className="flex items-center gap-2 sm:mt-6">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
              />
              <span className="text-sm">В наличии</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Проблема (текст после «Проблема:»)</label>
            <textarea
              value={form.problemText}
              onChange={(e) => setForm((f) => ({ ...f, problemText: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
              placeholder="застойные пятна, акне…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Этап ухода</label>
            <input
              value={form.careStageText}
              onChange={(e) => setForm((f) => ({ ...f, careStageText: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="увлажнение и питание"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Тип кожи (строка на карточке)</label>
            <textarea
              value={form.skinTypesLine}
              onChange={(e) => setForm((f) => ({ ...f, skinTypesLine: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={2}
              placeholder="комбинированная, жирная…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Заголовок блока исследований</label>
            <input
              value={form.scientistsTitle}
              onChange={(e) => setForm((f) => ({ ...f, scientistsTitle: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-600">Исследования (текст + ссылка)</label>
              <button
                type="button"
                className="text-xs text-zinc-600 underline"
                onClick={() => setForm((f) => ({ ...f, researchItems: [...f.researchItems, { label: "", url: "" }] }))}
              >
                + строка
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {form.researchItems.map((row, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-lg border border-zinc-100 p-2 sm:flex-row sm:items-center sm:gap-2">
                  <input
                    value={row.label}
                    onChange={(e) =>
                      setForm((f) => {
                        const researchItems = [...f.researchItems];
                        researchItems[i] = { ...researchItems[i], label: e.target.value };
                        return { ...f, researchItems };
                      })
                    }
                    className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm"
                    placeholder="Название / описание ссылки"
                  />
                  <input
                    value={row.url}
                    onChange={(e) =>
                      setForm((f) => {
                        const researchItems = [...f.researchItems];
                        researchItems[i] = { ...researchItems[i], url: e.target.value };
                        return { ...f, researchItems };
                      })
                    }
                    className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    className="shrink-0 text-xs text-red-600"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        researchItems: f.researchItems.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Для чего? (абзацы через пустую строку)</label>
            <textarea
              value={form.forWhatText}
              onChange={(e) => setForm((f) => ({ ...f, forWhatText: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
              rows={6}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Как работает? (каждая строка = отдельный пункт)</label>
            <textarea
              value={form.howItWorksRaw}
              onChange={(e) => setForm((f) => ({ ...f, howItWorksRaw: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={8}
              placeholder="Ниацинамид – …&#10;Транексамовая кислота – …"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Как использовать?</label>
            <textarea
              value={form.howToUseText}
              onChange={(e) => setForm((f) => ({ ...f, howToUseText: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Из чего состоит? (INCI)</label>
            <textarea
              value={form.inciText}
              onChange={(e) => setForm((f) => ({ ...f, inciText: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono text-xs"
              rows={4}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600">Объём</label>
              <input
                value={form.volumeText}
                onChange={(e) => setForm((f) => ({ ...f, volumeText: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="30 мл"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Срок годности</label>
              <input
                value={form.shelfLifeText}
                onChange={(e) => setForm((f) => ({ ...f, shelfLifeText: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="см. на упаковке"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">Страна</label>
              <input
                value={form.countryText}
                onChange={(e) => setForm((f) => ({ ...f, countryText: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Россия"
              />
            </div>
          </div>
          <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
            <p className="text-xs font-semibold text-zinc-800">Ссылки на маркетплейсы</p>
            <p className="mt-1 text-[11px] leading-snug text-zinc-600">
              Полная ссылка на карточку товара. Если поле заполнено — на сайте показывается кнопка «Купить на …» рядом с корзиной.
            </p>
            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Wildberries</label>
                <input
                  type="url"
                  value={form.linkWildberries}
                  onChange={(e) => setForm((f) => ({ ...f, linkWildberries: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="https://www.wildberries.ru/..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Ozon</label>
                <input
                  type="url"
                  value={form.linkOzon}
                  onChange={(e) => setForm((f) => ({ ...f, linkOzon: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="https://www.ozon.ru/..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Яндекс Маркет</label>
                <input
                  type="url"
                  value={form.linkYandexMarket}
                  onChange={(e) => setForm((f) => ({ ...f, linkYandexMarket: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="https://market.yandex.ru/..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">Видео дерматолога (обзор товара)</label>
                <input
                  type="url"
                  value={form.dermatologistVideoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, dermatologistVideoUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="YouTube, Vimeo или прямая ссылка на .mp4 / .webm"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            {saveLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductWithCat[];
  categories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductWithCat | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const openEdit = (p: ProductWithCat) => {
    setEditing(p);
    const imageUrls = (p as { imageUrls?: string[] }).imageUrls?.length
      ? (p as { imageUrls?: string[] }).imageUrls!
      : (p.imageUrl ? [p.imageUrl] : []);
    const px = p as { imageFocusX?: number | null; imageFocusY?: number | null };
    setForm({
      slug: p.slug,
      title: p.title,
      shortDesc: p.shortDesc || "",
      categoryId: p.categoryId,
      price: p.price,
      oldPrice: p.oldPrice ?? "",
      isNew: p.isNew,
      skinTypes: Array.isArray(p.skinTypes) ? p.skinTypes.join(", ") : "",
      imageUrl: p.imageUrl || "",
      imageUrls,
      imageFocusX: px.imageFocusX != null ? px.imageFocusX : 50,
      imageFocusY: px.imageFocusY != null ? px.imageFocusY : 50,
      composition: p.composition || "",
      components: p.components || "",
      extraField1: p.extraField1 || "",
      extraField2: p.extraField2 || "",
      featuredSortOrder: (p as { featuredSortOrder?: number | null }).featuredSortOrder ?? "",
      articleCode: (p as { articleCode?: string | null }).articleCode || "",
      problemText: (p as { problemText?: string | null }).problemText || "",
      careStageText: (p as { careStageText?: string | null }).careStageText || "",
      skinTypesLine: (p as { skinTypesLine?: string | null }).skinTypesLine || "",
      scientistsTitle: (p as { scientistsTitle?: string | null }).scientistsTitle || "Что говорят ученые?",
      researchItems: (() => {
        const items = parseResearchLinks((p as { researchLinks?: unknown }).researchLinks);
        return items.length
          ? items.map((x) => ({ label: x.label, url: x.url || "" }))
          : [{ label: "", url: "" }];
      })(),
      forWhatText: (p as { forWhatText?: string | null }).forWhatText || "",
      howItWorksRaw: Array.isArray((p as { howItWorksLines?: unknown }).howItWorksLines)
        ? ((p as { howItWorksLines: string[] }).howItWorksLines || []).join("\n")
        : "",
      howToUseText: (p as { howToUseText?: string | null }).howToUseText || "",
      inciText: (p as { inciText?: string | null }).inciText || "",
      volumeText: (p as { volumeText?: string | null }).volumeText || "",
      shelfLifeText: (p as { shelfLifeText?: string | null }).shelfLifeText || "",
      countryText: (p as { countryText?: string | null }).countryText || "",
      inStock: (p as { inStock?: boolean }).inStock !== false,
      isPromo: (p as { isPromo?: boolean }).isPromo ?? false,
      isBestseller: (p as { isBestseller?: boolean }).isBestseller ?? false,
      linkWildberries: (p as { linkWildberries?: string | null }).linkWildberries || "",
      linkOzon: (p as { linkOzon?: string | null }).linkOzon || "",
      linkYandexMarket: (p as { linkYandexMarket?: string | null }).linkYandexMarket || "",
      dermatologistVideoUrl: (p as { dermatologistVideoUrl?: string | null }).dermatologistVideoUrl || "",
    });
  };

  const openCreate = () => {
    setCreating(true);
    setForm(emptyForm());
    setForm((f) => ({ ...f, categoryId: categories[0]?.id ?? "" }));
  };

  const payloadDetail = (f: ReturnType<typeof emptyForm>) => ({
    researchLinks: f.researchItems.filter((r) => r.label.trim()).map((r) => ({ label: r.label.trim(), url: r.url.trim() || undefined })),
    howItWorksLines: f.howItWorksRaw.split("\n").map((s) => s.trim()).filter(Boolean),
    articleCode: f.articleCode.trim() || null,
    problemText: f.problemText.trim() || null,
    careStageText: f.careStageText.trim() || null,
    skinTypesLine: f.skinTypesLine.trim() || null,
    scientistsTitle: f.scientistsTitle.trim() || null,
    forWhatText: f.forWhatText.trim() || null,
    howToUseText: f.howToUseText.trim() || null,
    inciText: f.inciText.trim() || null,
    volumeText: f.volumeText.trim() || null,
    shelfLifeText: f.shelfLifeText.trim() || null,
    countryText: f.countryText.trim() || null,
    inStock: f.inStock,
    isPromo: f.isPromo,
    isBestseller: f.isBestseller,
  });

  const saveEdit = async () => {
    if (!editing) return;
    if (form.title.trim().length > MAX_PRODUCT_TITLE_LENGTH) {
      alert(`Название не длиннее ${MAX_PRODUCT_TITLE_LENGTH} символов`);
      return;
    }
    const res = await fetch(`/api/admin/products/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        skinTypes: form.skinTypes ? form.skinTypes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        imageUrls: form.imageUrls,
        imageFocusX: form.imageFocusX,
        imageFocusY: form.imageFocusY,
        featuredSortOrder: form.featuredSortOrder === "" ? null : form.featuredSortOrder,
        ...payloadDetail(form),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === updated.id ? { ...updated, category: editing.category } : x)));
      setEditing(null);
    }
  };

  const saveCreate = async () => {
    if (!form.categoryId || !form.slug?.trim() || !form.title?.trim()) return;
    if (form.title.trim().length > MAX_PRODUCT_TITLE_LENGTH) {
      alert(`Название не длиннее ${MAX_PRODUCT_TITLE_LENGTH} символов`);
      return;
    }
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        skinTypes: form.skinTypes ? form.skinTypes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        imageUrls: form.imageUrls,
        imageFocusX: form.imageFocusX,
        imageFocusY: form.imageFocusY,
        featuredSortOrder: form.featuredSortOrder === "" ? null : form.featuredSortOrder,
        ...payloadDetail(form),
      }),
    });
    if (res.ok) {
      const created = await res.json();
      const cat = categories.find((c) => c.id === created.categoryId);
      setProducts((prev) => [...prev, { ...created, category: cat! }].sort((a, b) => a.title.localeCompare(b.title)));
      setCreating(false);
      setForm(emptyForm());
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Добавить позицию
        </button>
      </div>

      {products.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4"
        >
          <div className="flex items-center gap-4">
            {((p as { imageUrls?: string[] }).imageUrls?.[0] ?? p.imageUrl ?? "") ? (
              <img
                src={(p as { imageUrls?: string[] }).imageUrls?.[0] ?? p.imageUrl ?? ""}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-zinc-100" />
            )}
            <div>
              <span className="font-medium">{p.title}</span>
              <span className="ml-2 text-zinc-500">({p.category.title})</span>
              <p className="text-sm text-zinc-600">{p.price} ₽</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openEdit(p)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Удалить позицию из каталога?")) return;
                const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
                if (res.ok) setProducts((prev) => prev.filter((x) => x.id !== p.id));
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <ProductForm
          form={form}
          setForm={setForm}
          categories={categories}
          onSave={saveEdit}
          onCancel={() => setEditing(null)}
          title="Редактировать позицию"
          saveLabel="Сохранить"
        />
      )}

      {creating && (
        <ProductForm
          form={form}
          setForm={setForm}
          categories={categories}
          onSave={saveCreate}
          onCancel={() => { setCreating(false); setForm(emptyForm()); }}
          title="Добавить позицию"
          saveLabel="Создать"
        />
      )}
    </div>
  );
}
