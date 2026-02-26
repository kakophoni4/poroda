"use client";

import { useRouter } from "next/navigation";

export default function AdminLogout({ className }: { className?: string }) {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };
  return (
    <button type="button" onClick={handleLogout} className={className}>
      Выйти
    </button>
  );
}
