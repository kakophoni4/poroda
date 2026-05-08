[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Локальная разработка

1. `docker compose up -d` — поднимает PostgreSQL на **:5433** (см. `docker-compose.yml`, пользователь/БД `poroda`).
2. `npm i`
3. `cp .env.example .env` — заполни `SESSION_SECRET` и `DATABASE_URL` (для шага 1: строка из `.env.example` с портом **5433** подходит, если не менял `docker-compose`).
4. `npx prisma migrate deploy && npx prisma db seed`
5. `npm run dev` → http://localhost:3000

Вход в админку: http://localhost:3000/admin/login — `admin@porodacosmetics.ru` / пароль из `ADMIN_SEED_PASSWORD` в `.env` (по умолчанию `admin123`, если не задан).

### Облачный PostgreSQL (без Docker)

1. Создай проект, например на [neon.tech](https://neon.tech), скопируй connection string в `.env` как `DATABASE_URL`.
2. `npm i` → `npx prisma migrate deploy` → `npx prisma db seed` → `npm run dev`

---

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) — an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
