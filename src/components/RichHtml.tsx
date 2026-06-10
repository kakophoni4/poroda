import { sanitizeRichHtml } from "@/lib/sanitize";

/** Безопасный вывод HTML из админки (жирный, списки, ссылки). */
export default function RichHtml({
  html,
  className,
  as: Tag = "div",
}: {
  html: string;
  className?: string;
  as?: "div" | "span" | "p" | "li";
}) {
  const safe = sanitizeRichHtml(html);
  if (!safe) return null;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}

/** Абзацы с HTML или plain text (разделитель — пустая строка). */
export function RichHtmlParagraphs({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className={className}>
      {parts.map((para, i) => (
        <RichHtml key={i} html={para} as="p" className={i > 0 ? "mt-4" : undefined} />
      ))}
    </div>
  );
}
