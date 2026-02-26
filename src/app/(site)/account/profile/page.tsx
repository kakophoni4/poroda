import Breadcrumbs from "@/components/Breadcrumbs";
import ProfileForm from "./ProfileForm";

export default function AccountProfilePage() {
  return (
    <>
      <Breadcrumbs items={[{ href: "/account", label: "Личный кабинет" }, { label: "Профиль" }]} />
      <h1 className="mt-4 text-2xl font-semibold">Профиль</h1>
      <ProfileForm />
    </>
  );
}
