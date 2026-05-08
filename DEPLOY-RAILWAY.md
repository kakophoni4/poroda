# Деплой PORODA на Railway

## 1. Репозиторий

- Закоммитьте проект в Git (GitHub / GitLab).
- Если приложение лежит в подпапке `poroda-site`, в Railway укажите **Root Directory**: `poroda-site`.

## 2. Новый проект в Railway

1. Зайдите на [railway.app](https://railway.app) и войдите (через GitHub и т.п.).
2. **New Project** → **Deploy from GitHub repo** и выберите репозиторий.
3. Если репозиторий — это папка `poroda` и внутри неё `poroda-site`:
   - **Settings** → **Deployment** → **Root Directory** → укажите `poroda-site`.

## 3. Переменные окружения

В проекте Railway: **Variables** и добавьте:

| Переменная       | Описание |
|------------------|----------|
| `DATABASE_URL`   | Строка подключения к PostgreSQL (сервис Postgres в Railway или внешний URL). |
| `SESSION_SECRET` | Секрет для сессий (придумайте длинную случайную строку). |

**Онлайн-оплата (эквайринг Альфа-Банк, см. `src/app/api/payment/create/route.ts`):**

| Переменная | Описание |
|------------|----------|
| `ALFABANK_USERNAME` | Логин из личного кабинета / договора. |
| `ALFABANK_PASSWORD` | Пароль. |
| `ALFABANK_CLIENT_ID` | При необходимости по документации провайдера. |
| `ALFABANK_API_URL` | Опционально; по умолчанию тестовый шлюз `https://api.uat.all2pay.net/v1`, для боя — URL из договора. |

**Формат `DATABASE_URL`:** `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public` (и при необходимости `sslmode=require` для облачных БД). Для миграций/сидов в CI и на проде используется `npx prisma migrate deploy` — в `schema.prisma` при PgBouncer в проде при необходимости можно добавить `directUrl` (документация Prisma).

## 4. Сборка и запуск

Railway обычно сам подхватывает Next.js. Проверьте в **Settings** → **Deployment**:

- **Build Command**: `npm run build` (у вас в `package.json` уже есть `prisma generate && next build`).
- **Start Command**: `npm run start` (т.е. `next start`).

Если используете **standalone** (в `next.config.ts` уже включён `output: "standalone"`), в Start Command можно указать:

```bash
node .next/standalone/server.js
```

Но по умолчанию `next start` тоже работает; standalone нужен для минимального образа и порта.

При необходимости в **Settings** задайте **Watch Paths**: `poroda-site/**`, чтобы пересборка шла только при изменениях в приложении.

## 5. База данных

- Создайте **PostgreSQL** в Railway (Add Service → Database → PostgreSQL) и скопируйте `DATABASE_URL` из переменных сервиса в переменные вашего веб-сервиса, либо укажите внешний кластер PostgreSQL.

После первого деплоя при необходимости примените миграции и сид с локальной машины, подставив продовый `DATABASE_URL`:

```bash
cd poroda-site
DATABASE_URL="ваш_продовый_url" npx prisma migrate deploy
DATABASE_URL="ваш_продовый_url" npx prisma db seed
```

## 6. Домен и HTTPS

В Railway: **Settings** → **Networking** → **Generate Domain**. Вам выдаётся URL автоматически, HTTPS включён.

## Краткий чеклист

- [ ] Репозиторий на GitHub, Root Directory = `poroda-site` (если нужно).
- [ ] В Railway заданы `DATABASE_URL` и `SESSION_SECRET`.
- [ ] Build: `npm run build`, Start: `npm run start` (или `node .next/standalone/server.js` при standalone).
- [ ] После деплоя при необходимости: `npx prisma migrate deploy` и `npx prisma db seed` с продовым `DATABASE_URL`.
