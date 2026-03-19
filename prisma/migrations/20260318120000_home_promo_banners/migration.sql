-- HomePromoBanner: акционные баннеры на главной
CREATE TABLE IF NOT EXISTS "HomePromoBanner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL DEFAULT '',
    "buttonText" TEXT NOT NULL DEFAULT '',
    "buttonColor" TEXT NOT NULL DEFAULT '#18181b',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePromoBanner_pkey" PRIMARY KEY ("id")
);
