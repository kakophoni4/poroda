import ViewTracker from "./ViewTracker";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-6">
      <ViewTracker />
      {children}
    </div>
  );
}
