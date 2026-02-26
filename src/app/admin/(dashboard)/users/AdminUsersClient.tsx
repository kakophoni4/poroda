"use client";

type User = { id: string; email: string; name: string | null; phone: string | null; createdAt: Date; ordersCount: number };

export default function AdminUsersClient({ users }: { users: User[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-600">
            <th className="pb-3 pr-4">Имя</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Телефон</th>
            <th className="pb-3 pr-4">Заказов</th>
            <th className="pb-3">Регистрация</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-zinc-100">
              <td className="py-3 pr-4">{u.name || "—"}</td>
              <td className="py-3 pr-4">{u.email}</td>
              <td className="py-3 pr-4">{u.phone || "—"}</td>
              <td className="py-3 pr-4">{u.ordersCount}</td>
              <td className="py-3 text-zinc-500">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
