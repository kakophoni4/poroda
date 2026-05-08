import Link from "next/link";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import VerifyEmailClient from "./VerifyEmailClient";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <PageShell>
      <Container className="max-w-md">
        <Breadcrumbs items={[{ label: "Подтверждение email" }]} />
        <h1 className="mt-4 text-2xl font-semibold">Подтверждение email</h1>
        <p className="mt-2 text-sm text-zinc-600">Мы сейчас проверим ссылку из письма.</p>
        <VerifyEmailClient token={token} />
        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link href="/" className="font-medium text-zinc-900 underline hover:no-underline">
            На главную
          </Link>
        </p>
      </Container>
    </PageShell>
  );
}
