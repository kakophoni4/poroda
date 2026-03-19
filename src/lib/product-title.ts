/** Максимальная длина названия позиции каталога (ввод в админке и API). */
export const MAX_PRODUCT_TITLE_LENGTH = 40;

export function normalizeProductTitle(title: string): string {
  return title.trim().slice(0, MAX_PRODUCT_TITLE_LENGTH).trimEnd();
}

/** Отображение в карточках каталога / сетках (на случай старых длинных названий в БД). */
export function catalogDisplayTitle(title: string): string {
  const t = title.trim();
  if (t.length <= MAX_PRODUCT_TITLE_LENGTH) return t;
  return `${t.slice(0, MAX_PRODUCT_TITLE_LENGTH - 1).trimEnd()}…`;
}

/** Если название длинное — в карточке показываем описание короче. */
export function catalogDescriptionLineClamp(titleForCard: string): 1 | 2 {
  return titleForCard.length >= 30 ? 1 : 2;
}
