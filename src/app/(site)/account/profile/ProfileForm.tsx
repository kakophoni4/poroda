"use client";

import { useState } from "react";

export default function ProfileForm() {
  const [name, setName] = useState("Ирина Петрова");
  const [email, setEmail] = useState("irina@example.com");
  const [phone, setPhone] = useState("+7 999 123-45-67");

  return (
    <form className="mt-6 max-w-md space-y-4">
      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-zinc-700">Имя</label>
        <input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="profile-email" className="block text-sm font-medium text-zinc-700">Email</label>
        <input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <div>
        <label htmlFor="profile-phone" className="block text-sm font-medium text-zinc-700">Телефон</label>
        <input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-2.5" />
      </div>
      <button type="button" className="rounded-2xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">Сохранить</button>
    </form>
  );
}
