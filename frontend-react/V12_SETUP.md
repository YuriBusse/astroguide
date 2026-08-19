# AstroGuide V12 — Backend Foundation

## 1. Frontend
```powershell
npm.cmd install
npm.cmd run dev
```

## 2. Supabase
Create a project and run `supabase/schema.sql` in the SQL editor.

Then copy `.env.example` to `.env` and fill:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Restart Vite after changing `.env`.

With these variables present, registration/login and saved charts use Supabase. Without them, the app stays in local fallback mode.

## 3. Backend
Copy `server/.env.example` to `server/.env` and fill server-only secrets.

Run in a second terminal:
```powershell
npm.cmd run server
```

Health check:
`http://localhost:8787/api/health`

## 4. Payments
V12 only prepares a secure server endpoint for the payment flow. Do not put the YooKassa secret key into Vite or `.env` variables beginning with `VITE_`.

Real payment creation/webhook verification should be enabled only after the YooKassa shop is configured.


## V13 — реальная оплата через ЮKassa

1. Выполните `supabase/schema.sql` в SQL Editor ещё раз, чтобы добавить поля заказов для карты.
2. Скопируйте `server/.env.example` в `server/.env`.
3. Заполните `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`.
4. Не добавляйте `server/.env` в Git и не отправляйте секретный ключ в чат. Supabase рекомендует держать секретные ключи только на серверной стороне. 
5. Запустите frontend: `npm.cmd run dev`
6. В отдельном терминале запустите backend: `npm.cmd run server`
7. Проверьте `http://localhost:8787/api/health`.
8. Для реального webhook нужен публичный HTTPS-адрес сервера. В ЮKassa укажите `https://ВАШ-ДОМЕН/api/yookassa/webhook` и событие `payment.succeeded`.
9. После оплаты ЮKassa отправляет webhook; сервер повторно запрашивает платёж у ЮKassa, проверяет `succeeded`, помечает заказ `paid` и включает Premium для соответствующей карты.

Важно: в локальной разработке localhost не сможет принять входящий webhook от ЮKassa. Поэтому для полного end-to-end теста позже понадобится публичный HTTPS backend.
