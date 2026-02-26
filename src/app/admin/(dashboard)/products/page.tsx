import AdminProductsClient from "./AdminProductsClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }], include: { category: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <h1 className="text-2xl font-semibold">Товары</h1>
      <p className="mt-1 text-sm text-zinc-600">Управление каталогом: добавление, редактирование, удаление.</p>
      <AdminProductsClient initialProducts={products} categories={categories} />
    </>
  );
}
