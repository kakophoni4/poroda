import Container from "@/components/Container";
import PageShell from "@/components/PageShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <PageShell>
      <Container className="max-w-md">
        <Breadcrumbs items={[{ label: "Регистрация" }]} />
        <h1 className="mt-4 text-2xl font-semibold">Регистрация</h1>
        <p className="mt-2 text-sm text-zinc-600">Создайте аккаунт для доступа к заказам, скидкам и уведомлениям.</p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-zinc-600">
          Уже есть аккаунт? <a href="/login" className="font-medium text-zinc-900 underline hover:no-underline">Войти</a>
        </p>
      </Container>
    </PageShell>
  );
}
