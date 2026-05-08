import Link from "next/link";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import ResetPasswordClient from "./ResetPasswordClient";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <PageShell>
      <Container className="max-w-md">
        <Breadcrumbs items={[{ label: "Новый пароль" }]} />
        <h1 className="mt-4 text-2xl font-semibold">Сброс пароля</h1>
        <p className="mt-2 text-sm text-zinc-600">Введите новый пароль для своего аккаунта.</p>
        <ResetPasswordClient token={token} />
        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link href="/login" className="font-medium text-zinc-900 underline hover:no-underline">
            Ко входу
          </Link>
        </p>
      </Container>
    </PageShell>
  );
}
