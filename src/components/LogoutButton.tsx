"use client";

import { useCallback, useEffect, useState } from "react";

type Props = { className?: string };

export default function LogoutButton({ className }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setShow(!!d.user);
      })
      .catch(() => {
        if (!cancelled) setShow(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onLogout = useCallback(async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      window.location.assign("/");
    }
  }, []);

  if (!show) return null;

  return (
    <button type="button" onClick={() => void onLogout()} className={className}>
      Выйти
    </button>
  );
}
