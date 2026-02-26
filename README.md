This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Как запустить проект (без Docker и без SQLite)

Нужен **PostgreSQL**. Два варианта:

### Вариант А: бесплатный облачный PostgreSQL (проще всего)

1. Зайди на **[neon.tech](https://neon.tech)** → Sign up (можно через GitHub).
2. Создай проект (Create project), выбери регион.
3. На странице проекта скопируй **Connection string** (типа `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
4. В папке проекта создай файл **`.env`** (если его нет) и вставь:
   ```env
   DATABASE_URL="вставь_сюда_скопированную_строку"
   SESSION_SECRET=любая-случайная-строка
   ```
5. В терминале из папки проекта выполни по порядку:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```
6. Открой в браузере: **http://localhost:3000**
7. Вход в админку: **http://localhost:3000/admin/login**  
   Логин: `admin@porodacosmetics.ru`  
   Пароль: `admin123` (или тот, что задал в `ADMIN_SEED_PASSWORD` в `.env` перед сидом).

### Вариант Б: PostgreSQL установлен на твоём ПК

1. **Создай базу** — открой pgAdmin, подключись к серверу, открой Query Tool и выполни:
   ```sql
   CREATE DATABASE poroda;
   ```
   Либо из папки проекта: `node scripts/create-db.js` (подставится пользователь/пароль из `.env`).

2. В папке проекта создай или отредактируй **`.env`** — укажи **своего** пользователя и пароль PostgreSQL:
   ```env
   DATABASE_URL="postgresql://postgres:ТВОЙ_ПАРОЛЬ@localhost:5432/poroda"
   SESSION_SECRET=любая-случайная-строка
   ```
   Если логин не `postgres`, подставь: `postgresql://ЛОГИН:ПАРОЛЬ@localhost:5432/poroda`.

3. В терминале выполни:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```
4. Админка: **http://localhost:3000/admin/login** (логин: `admin@porodacosmetics.ru`, пароль: `admin123`).

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
