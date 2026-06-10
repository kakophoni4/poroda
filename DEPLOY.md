# Деплой PORODA на VPS (Ubuntu/Debian) + pm2

Пошаговый чек-лист, после которого продакшн запускается «чистым»:
шаблонные тексты и фотографии из репо, **без** тестовых заказов/отзывов/загрузок,
которые накопились во время разработки. Заказчик потом сам зальёт фото через админку.

> Подразумевается, что у тебя есть VPS с Ubuntu/Debian, root/sudo доступ,
> привязанный домен (DNS A-запись на IP сервера) и установленные:
> Node.js 22+, pnpm/npm, PostgreSQL 14+, nginx, certbot, pm2.
> Если чего-то нет — поставь:
> ```
> curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
> sudo apt install -y nodejs postgresql nginx certbot python3-certbot-nginx
> sudo npm i -g pm2
> ```

---

## 0. Что должно быть в репозитории, чего быть не должно

| Должно лежать | Не должно лежать |
|---|---|
| `public/images/**` — шаблонные фото из репо | `public/uploads/**` — тестовые загрузки |
| `prisma/migrations/**` | `.env`, `.env.local` |
| `prisma/seed.ts`, `prisma/clean-test-data.ts` | `node_modules`, `.next`, дамп локальной БД |

Проверь перед `git push`:
```bash
git ls-files public/uploads     # должно быть пусто
git ls-files | grep -E '^\.env$' # должно быть пусто
```

---

## 1. Подготовка сервера

```bash
# Каталоги под проект и постоянный диск для загрузок
sudo mkdir -p /srv/poroda-site
sudo mkdir -p /var/poroda/uploads
sudo chown -R $USER:$USER /srv/poroda-site /var/poroda/uploads

# Postgres: создать БД и юзера
sudo -u postgres psql <<SQL
CREATE USER poroda WITH PASSWORD 'СГЕНЕРИРОВАННЫЙ_ПАРОЛЬ';
CREATE DATABASE poroda OWNER poroda;
SQL
```

---

## 2. Клонировать проект

```bash
cd /srv/poroda-site
git clone https://github.com/ВАША_ОРГ/poroda.git .
# или scp/rsync — как договорились с git-хостингом
```

---

## 3. `.env` на сервере

```bash
cp .env.example .env
nano .env
```

Минимально заполнить:

```ini
DATABASE_URL=postgresql://poroda:СГЕНЕРИРОВАННЫЙ_ПАРОЛЬ@127.0.0.1:5432/poroda

# !!! ОБЯЗАТЕЛЬНО !!! без этого приложение упадёт при старте
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")

# Альфа-Банк: production endpoint и креды от банка
ALFABANK_USERNAME=ваш_логин
ALFABANK_PASSWORD=ваш_пароль
ALFABANK_CLIENT_ID=ваш_clientId
ALFABANK_API_URL=https://api.all2pay.net/v1   # уточнить у банка точный prod URL

# Публичный URL (https) без хвостового / — в оплате передаётся callbackUrl: {NEXT}/api/payment/webhook
NEXT_PUBLIC_SITE_URL=https://porodacosmetics.ru
# Симметричный секрет all2pay для HMAC в callback (должен совпадать с кабинетом банка, см. router-callbacks)
ALFABANK_CALLBACK_SECRET=секрет_из_кабинета_all2pay

# Постоянная папка загрузок ВНЕ репо — переживёт git pull и npm run build
UPLOAD_DIR=/var/poroda/uploads

# Telegram-уведомления админам: см. абзац про Telegram ниже (опц.)
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
# TELEGRAM_NOTIFY_ENABLED=true

# Пароль первого администратора (после первого seed смени через админку!)
ADMIN_SEED_PASSWORD=надежный_пароль_сразу

# Почта (подтверждение email, сброс пароля) — nodemailer + SMTP, см. раздел «SMTP и письма» ниже
EMAIL_ENABLED=true
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@домен.ru
SMTP_PASSWORD=пароль_приложения_не_от_ящика
EMAIL_FROM="PORODA Cosmetics <no-reply@домен.ru>"
```

Сгенерировать `SESSION_SECRET` одной командой:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```
и подставить в `.env`. Этот секрет менять НЕЛЬЗЯ после запуска — иначе все сессии разлогинятся.

**Telegram-уведомления админам (опционально):** при оформлении заказа и при онлайн-оплате сайт шлёт сообщения через [Telegram Bot API](https://core.telegram.org/bots/api) (дополнительный процесс/воркер не нужен). В `.env` можно задать `TELEGRAM_BOT_TOKEN` (токен у @BotFather), `TELEGRAM_CHAT_ID` (id приватного чата, личного id или id группы — для группы добавь бота в участники и сделай админом) и `TELEGRAM_NOTIFY_ENABLED` (например `true` или `false` — см. комментарии в `.env.example`). Если `TELEGRAM_NOTIFY_ENABLED` не равен `true` либо не заданы токен и чат, уведомления не отправляются, при этом оформление заказа и логика оплаты ведут себя как и прежде.

### SMTP и письма

Регистрация, повторная отправка подтверждения email и сброс пароля дублируют ссылки в личный кабинет (`UserNotification`) и **отправляют письмо** через [nodemailer](https://nodemailer.com/) (обычный SMTP, без привязки к вендору). Укажи любой рабочий SMTP-аккаунт, например:

- **Yandex 360** — [Почта → Настройки](https://mail.yandex.ru/) → пароли для приложений; host `smtp.yandex.ru`, порт **465** + `SMTP_SECURE=true`, либо **587** + `SMTP_SECURE=false` (STARTTLS).
- **Почта для домена (Mail.ru бизнес)** — в кабинете: SMTP-хост и порт, для входа — отдельный **пароль для внешнего приложения** к ящику (не личный пароль).
- **Timeweb** — в панели раздел «Почта» / **SMTP** для конкретного ящика (хост, порт, логин = полный email).
- **Сайт на Альфа-хостинге** — [документация](https://www.netangels.ru/support/hosting/how-to/imap-pop3) по SMTP, как правило `smtp+порт+SSL` в панели.

Переменные: см. `.env.example` — `EMAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` (только **пароль приложения** или сгенерированный SMTP-пароль, не свети его в чате и в логах; приложение **никогда** не пишет его в `console` и в JSON-ответы API), `EMAIL_FROM`, плюс обязательно **`NEXT_PUBLIC_SITE_URL`** (абсолютные ссылки в письмах). Если `EMAIL_ENABLED` не `true` или креды не настроены, письмо не уходит, API работает как раньше, в `pm2 logs` / stdout будет строка вроде `[mail disabled] …` или предупреждение о настройке SMTP. Ошибка доставки логируется как `[mail] send error: …` **без** пароля; колбэк в БД на факт доставки не вешается (письмо могло уйти с задержкой).

**Проверка TLS (что порт и шифрование совпали):** с VPS можно выполнить, например:

```bash
openssl s_client -connect smtp.yandex.ru:465 -crlf -quiet < /dev/null
```

(должен установиться SSL-сессия; для 587 вместо этого — `openssl s_client -starttls smtp -connect smtp.yandex.ru:587`).

**Логи nodemailer:** в проде смотри вывод процесса Next (`pm2 logs poroda-site` или как назван процесс): успешная отправка не пишет подробностей, отключение — `[mail disabled]`, сбой — `[mail] send error:` + текст ошибки. Детальный SMTP-дамп (`debug`, `logger`) в коде не включён, чтобы в лог не утечали креды и сырые письма.

---

## 4. База данных и Prisma

### Миграции

- Каталог `prisma/migrations/` в репозитории — единственный источник правды по **SQL-схеме** БД.
- `npx prisma migrate deploy` последовательно применяет **все** миграции, которые ещё не записаны в `_prisma_migrations` (ниже в разделе примеры для **пустой** БД и для **уже существующей** прод-схемы).
- В проде схему накатываем только через миграции, не через `prisma db push`.

### Первый деплой (чистая БД)

1. `npx prisma generate`
2. `npx prisma migrate deploy` — накатит **все** миграции из `prisma/migrations/`. На пустой базе сейчас применяется единая миграция `20260427000000_init_schema` (финальное состояние схемы из `schema.prisma`).
3. `npx prisma db seed` (или `npm run db:seed` — в `prisma.config.ts` задан тот же сид) — шаблонные данные, админ, каталог и т.д.

### Последующие релизы

- После `git pull` и `npm ci`: `npx prisma migrate deploy` — **новые** миграции, добавленные в репозиторий, применяются автоматически, без ручного выбора файлов.

### Пример жёсткого отката схемы (все данные в `public` пропадут)

Сначала снимите дамп. Затем можно полностью сбросить схему **public** и заново накатить миграции (подставьте свой DSN, на VPS часто `postgresql://user:…@127.0.0.1:5432/…`):

```bash
psql "$DATABASE_URL" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
npx prisma migrate deploy
npx prisma db seed
```

(Эквивалент: `CREATE DATABASE` заново — см. **раздел 11** в этом файле, «Полный сброс БД…».)

### Если у тебя уже есть прод-БД, поднятая через `db push` или старую цепочку миграций

Схема таблиц уже соответствует текущему `schema.prisma`, но в `_prisma_migrations` **нет** записи о `20260427000000_init_schema`. В этом случае **нельзя** снова выполнять SQL этой миграции: пометь её применённой, не запуская SQL:

```bash
npx prisma migrate resolve --applied 20260427000000_init_schema
```

После этого `migrate deploy` на проде будет применять только **новые** миграции, которые появятся в `prisma/migrations/` после `init_schema`.

> Если фактическая схема на стороне **расходится** с репо (редкий случай), сначала выровняй схему/данные (или восстанови из бэкапа) — `resolve` лишь синхронизирует **учёт** миграций с уже существующим состоянием.

---

## 5. Загрузки (`UPLOAD_DIR`) и сборка

В `.env` задай `UPLOAD_DIR=/var/poroda/uploads`. **Не создавай** симлинк `public/uploads` в корне проекта —
Turbopack (Next.js 16) падает при `npm run build`, если `public/uploads` указывает вне папки проекта.

Скрипты делают это автоматически:
- `prebuild` — удаляет `public/uploads`, если это симлинк (файлы в `/var/poroda/uploads` не трогает)
- `postbuild` — симлинк `.next/standalone/public/uploads` → `UPLOAD_DIR` для runtime

**Рекомендуется (надёжнее):** nginx alias, симлинки не нужны:
```nginx
location /uploads/ {
    alias /var/poroda/uploads/;
    expires 30d;
    access_log off;
}
```

Если на сервере остался старый симлинк и build падает — один раз:
```bash
rm -f /srv/poroda-site/public/uploads   # только ссылка, не rm -rf!
npm run build
```

---

## 6. Установка зависимостей и Prisma

```bash
cd /srv/poroda-site
npm ci                              # точные версии из package-lock.json
npx prisma generate
npx prisma migrate deploy           # см. «База данных и Prisma» — все миграции из prisma/migrations/
```

---

## 7. Сидинг шаблонных данных

```bash
npm run db:seed
```

Что засеется:
- админ `admin@porodacosmetics.ru` с паролем из `ADMIN_SEED_PASSWORD`;
- 6 категорий + 7 шаблонных товаров с фото из `public/images/poroda/N/1.jpg`;
- развёрнутая демо-карточка «Сыворотка-бустер»;
- баннер на главной (`/images/obshchie/hero.jpg`);
- 6 карточек «Выберите вашу проблему»;
- квиз и 6 статей блока «Исследования».

> Сидер **идемпотентный**: повторный `npm run db:seed` НЕ затрёт правки заказчика
> (фото/тексты/цены). Создаются только недостающие записи.

---

## 8. Сборка и запуск через pm2

```bash
npm run build
```

`npm run build` запускает `next build` в `output: standalone` и затем
`scripts/sync-standalone-static.mjs`, который копирует:
- `.next/static/*` → `.next/standalone/.next/static/`
- `public/*` (кроме `uploads/` — он у нас симлинком из VPS-папки) → `.next/standalone/public/`

Запуск (в репо есть `start-prod.sh` — подтягивает `.env`, выставляет `NODE_ENV=production`):
```bash
chmod +x start-prod.sh
pm2 start start-prod.sh --name poroda --interpreter bash
pm2 save
pm2 startup systemd     # один раз — зарегистрировать автозапуск
```

> **Не задавай `NODE_ENV` в `.env`.** Если там `NODE_ENV=development`, `next build` в Next.js 16
> падает на prerender `/_global-error` (`useContext` null). Next сам выставляет режим:
> `next dev` → development, `next build` / standalone → production.

Альтернатива без скрипта:
```bash
pm2 start ecosystem.config.cjs --env production
```

Минимальный `ecosystem.config.cjs` (положи в корень проекта, по желанию):

```js
module.exports = {
  apps: [
    {
      name: "poroda",
      cwd: "/srv/poroda-site",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "512M",
    },
  ],
};
```

---

## 9. nginx + HTTPS

`/etc/nginx/sites-available/poroda`:

```nginx
server {
    listen 80;
    server_name porodacosmetics.ru www.porodacosmetics.ru;

    client_max_body_size 12m;   # совпадает с MAX_BYTES в admin/upload (10 МБ)

    # если выбрали nginx alias вместо симлинка — раскомментируй:
    # location /uploads/ {
    #     alias /var/poroda/uploads/;
    #     expires 30d;
    #     access_log off;
    # }

    # Callback all2pay (HMAC) должен быть доступен с Internet как POST, без basic auth
    # и без отдельного `deny` на /api. Достаточно общего `location /` (как ниже) — путь
    # /api/payment/webhook проксируется на тот же Next, что и сайт.

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -sfn /etc/nginx/sites-available/poroda /etc/nginx/sites-enabled/poroda
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d porodacosmetics.ru -d www.porodacosmetics.ru
```

---

## 10. Если на сервер уехала ТЕСТОВАЯ БД (или ты копируешь свою локальную)

В этом проекте есть отдельная команда для очистки тестовых данных без удаления каталога:

```bash
# Сначала ОБЯЗАТЕЛЬНО снять дамп!
sudo -u postgres pg_dump poroda > /root/poroda-backup-$(date +%F).sql

# Подтверждение требует флаг --yes — случайный запуск ничего не сотрёт.
npm run db:clean-test-data -- --yes
```

Что удаляется:
- `Order`, `OrderItem`, `CustomerReview`, `PromoUse`,
- `WheelSpinLog`, `WheelGlobalCounter`,
- `UserNotification`, `PageView`, `Mailing`,
- все `User`,
- все `Promo`, **кроме** сидового `WELCOME10` (его `usedCount` сбрасывается в 0).

Что НЕ трогается:
- `Admin`, `Category`, `Product`, `SiteCopy`,
- `HomePromoBanner`, `HomeConcernCard`, `QuizQuestion`, `QuizAnswer`, `HomeArticle`.

После очистки рекомендуется вручную почистить файлы старых отзывов (на ссылки в БД они уже не указывают):

```bash
rm -rf /var/poroda/uploads/reviews/*
```

---

## 11. Полный сброс БД до состояния «как после сида»

Если нужно гарантированно начать с нуля (например, при первом релизе):

```bash
# !!! Удалит ВСЕ данные. Сначала pg_dump !!!
sudo -u postgres psql -c "DROP DATABASE poroda;"
sudo -u postgres psql -c "CREATE DATABASE poroda OWNER poroda;"
npx prisma migrate deploy
npm run db:seed
```

---

## 12. Обновление кода (CI/CD вручную)

```bash
cd /srv/poroda-site
git pull --ff-only
npm ci
npx prisma migrate deploy   # применит новые миграции из prisma/migrations/, если есть
npm run build
pm2 restart poroda
```

Загрузки в `/var/poroda/uploads/` и данные в БД остаются нетронутыми.

---

## 13. Регулярные бэкапы (минимум)

Добавь в crontab:

```bash
0 4 * * * sudo -u postgres pg_dump poroda | gzip > /root/backups/poroda-$(date +\%F).sql.gz
0 5 * * * tar czf /root/backups/uploads-$(date +\%F).tar.gz -C /var/poroda uploads
0 6 * * 0 find /root/backups -mtime +30 -delete   # хранить 30 дней
```

---

## 14. Чек-лист перед передачей заказчику

- [ ] `.env`: реальные `DATABASE_URL`, `SESSION_SECRET`, `ALFABANK_*` (включ. `ALFABANK_CALLBACK_SECRET`), `NEXT_PUBLIC_SITE_URL`, `UPLOAD_DIR`.
- [ ] `npx prisma migrate deploy` — все миграции применены.
- [ ] `npm run db:seed` — каталог создан, пробные товары на месте.
- [ ] `/var/poroda/uploads` — пустая, права принадлежат пользователю pm2.
- [ ] Симлинк `public/uploads → /var/poroda/uploads` ИЛИ nginx alias настроен.
- [ ] `pm2 status` — приложение `poroda` работает, `pm2 startup` зарегистрирован.
- [ ] HTTPS-сертификат выдан, сайт открывается на домене.
- [ ] Логин в `/admin/login`: `admin@porodacosmetics.ru` / `ADMIN_SEED_PASSWORD`.
- [ ] **Сразу сменить пароль администратора** в админке.
- [ ] Альфа-Банк: тестовая оплата на 1 ₽ прошла, заказ перешёл в `paid`.
- [ ] Бэкап cron работает (`crontab -l`).
