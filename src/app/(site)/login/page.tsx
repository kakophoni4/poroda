import { Suspense } from "react";
import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <PageShell>
      <Container className="max-w-md">
        <Breadcrumbs items={[{ label: "Вход" }]} />
        <h1 className="mt-4 text-2xl font-semibold">Вход</h1>
        <p className="mt-2 text-sm text-zinc-600">Войдите в личный кабинет, чтобы видеть заказы и скидки.</p>
        <Suspense fallback={<div className="mt-8 h-32 animate-pulse rounded-xl bg-zinc-100" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Нет аккаунта? <a href="/register" className="font-medium text-zinc-900 underline hover:no-underline">Зарегистрироваться</a>
        </p>
      </Container>
    </PageShell>
  );
}
