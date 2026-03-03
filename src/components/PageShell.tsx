import ViewTracker from "./ViewTracker";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 sm:py-14">
      <ViewTracker />
      {children}
    </div>
  );
}
