import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "a", "img", "hr",
  "table", "thead", "tbody", "tr", "td", "th",
  "span", "div",
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  "*": ["class"],
};

export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}

/** Для коротких текстовых полей (title, description без HTML). */
export function sanitizeText(input: string | null | undefined, maxLen = 1000): string {
  if (!input) return "";
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).slice(0, maxLen);
}

/** Текст без тегов, без усечения (для проверки max length в маршрутах). */
export function sanitizePlainString(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(String(input), { allowedTags: [], allowedAttributes: {} });
}

/** Rich-текст; пустой ввод — null (опциональные поля в БД). */
export function nullIfEmptyRich(input: string | null | undefined): string | null {
  const t = input == null ? "" : String(input).trim();
  if (!t) return null;
  const out = sanitizeRichHtml(t);
  return out || null;
}

export function sanitizeRichTextLines(lines: string[] | null | undefined): string[] {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  return lines
    .map((s) => sanitizeRichHtml(String(s).trim()))
    .filter((s) => s.length > 0);
}

export function sanitizeStringList(
  list: string[] | null | undefined,
  perItemMax = 200
): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => sanitizeText(String(s), perItemMax).trim())
    .filter((s) => s.length > 0);
}
