-- Ограничение частоты попыток входа/регистрации (brute-force)
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthAttempt_scope_identifier_createdAt_idx" ON "AuthAttempt"("scope", "identifier", "createdAt");
CREATE INDEX "AuthAttempt_scope_ipHash_createdAt_idx" ON "AuthAttempt"("scope", "ipHash", "createdAt");
