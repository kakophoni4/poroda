import AdminSiteCopyClient from "./AdminSiteCopyClient";
import { getSiteCopyMap } from "@/lib/site-copy-server";

export default async function AdminSiteCopyPage() {
  const initialMap = await getSiteCopyMap();
  return <AdminSiteCopyClient initialMap={initialMap} />;
}
