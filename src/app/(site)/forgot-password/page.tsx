import Link from "next/link";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <PageShell>
      <Container className="max-w-md">
        <Breadcrumbs items={[{ label: "Сброс пароля" }]} />
        <h1 className="mt-4 text-2xl font-semibold">Забыли пароль?</h1>
        <p className="mt-2 text-sm text-zinc-600">Укажите email, который вы указывали при регистрации.</p>
        <ForgotPasswordClient />
        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link href="/login" className="font-medium text-zinc-900 underline hover:no-underline">
            Вернуться ко входу
          </Link>
        </p>
      </Container>
    </PageShell>
  );
}
