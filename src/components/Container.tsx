export default function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-6 ${className}`}>{children}</div>;
}
