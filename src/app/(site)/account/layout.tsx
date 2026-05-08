import { Suspense } from "react";
import Container from "@/components/Container";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AccountEmailVerifyClient from "./AccountEmailVerifyClient";
import AccountNav from "./AccountNav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  const user =
    session == null
      ? null
      : await prisma.user.findUnique({
          where: { id: session.userId },
          select: { email: true, emailVerifiedAt: true },
        });
  const needsVerify = user != null && user.emailVerifiedAt == null;
  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col gap-8">
          <AccountNav />
          {user != null ? (
            <Suspense fallback={null}>
              <div className="w-full text-left">
                <div className="mx-auto w-full max-w-xl">
                  <AccountEmailVerifyClient email={user.email} needsVerify={needsVerify} />
                </div>
              </div>
            </Suspense>
          ) : null}
          <main className="min-w-0 w-full">
            <div className="mx-auto w-full max-w-xl text-center">{children}</div>
          </main>
        </div>
      </Container>
    </div>
  );
}
