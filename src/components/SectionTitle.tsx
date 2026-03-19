export default function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle ? <p className="max-w-2xl text-sm text-zinc-600">{subtitle}</p> : null}
    </div>
  );
}
