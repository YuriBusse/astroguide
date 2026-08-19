# AstroGuide V16 — Secure Premium + YooKassa

В V16 Premium считается доступным только после серверной проверки `charts.premium`.
Локальный `localStorage` больше не является источником истины для доступа.

## Локальная настройка

В корневом `.env` (рядом с package.json) оставьте:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

FRONTEND_ORIGIN=http://localhost:5173
VITE_ASTROGUIDE_SERVER_URL=http://localhost:8787
```

Для реальной оплаты добавьте туда же:

```env
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
```

Секретный ключ никогда не добавляйте в `VITE_*` переменные.

## Проверка

Терминал 1:
`npm.cmd run dev`

Терминал 2:
`npm.cmd run server`

Проверка backend:
`curl.exe http://localhost:8787/api/health`

Ожидается:
`supabaseConfigured:true`

После добавления ключей YooKassa:
`yookassaConfigured:true`

## Как работает Premium

1. Пользователь должен войти в аккаунт.
2. Backend создаёт/находит его карту и заказ.
3. Backend создаёт платёж YooKassa.
4. После возврата frontend спрашивает `/api/payment-status`.
5. Backend дополнительно сверяет платёж через YooKassa.
6. Webhook `payment.succeeded` также повторно проверяет платёж.
7. Только после подтверждённого платежа сервер устанавливает `charts.premium=true`.
8. Frontend получает Premium через `/api/premium-status`.

Для production webhook должен быть доступен по HTTPS, например:
`https://YOUR_DOMAIN/api/yookassa/webhook`.

## Важно

Пока ключи YooKassa не добавлены, кнопка оплаты корректно покажет, что платежи ещё не настроены. Это не ошибка приложения.
