# AstroGuide V17 — YooKassa

V17 подключает реальный платёжный контур к уже готовому Premium.

## 1. Что уже реализовано

Frontend уже вызывает:

- `POST /api/create-payment`
- `GET /api/payment-status`
- `POST /api/yookassa/webhook`

Backend:

1. проверяет авторизацию Supabase;
2. создаёт/находит карту пользователя;
3. создаёт запись `orders` со статусом `pending`;
4. создаёт платёж в YooKassa на 499 RUB;
5. сохраняет `provider_payment_id`;
6. после оплаты повторно проверяет платёж через API YooKassa;
7. при `succeeded` переводит заказ в `paid`;
8. открывает `charts.premium = true`.

## 2. Переменные .env

Файл должен быть:

`D:\AstroGuide\frontend-react\.env`

Добавьте:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_KEY

YOOKASSA_SHOP_ID=YOUR_YOOKASSA_SHOP_ID
YOOKASSA_SECRET_KEY=YOUR_YOOKASSA_SECRET_KEY

FRONTEND_ORIGIN=http://localhost:5173
PORT=8787
```

`YOOKASSA_SECRET_KEY` и `SUPABASE_SERVICE_ROLE_KEY` нельзя помещать в переменные `VITE_*`.

## 3. Где взять данные YooKassa

В кабинете YooKassa найдите данные магазина:

- Shop ID (`shopId`)
- Секретный ключ

Никогда не отправляйте секретный ключ в чат и не добавляйте `.env` в ZIP/Git.

## 4. Проверка локального backend

После изменения `.env` обязательно перезапустите сервер:

```powershell
Ctrl + C
npm.cmd run server
```

Проверка:

```powershell
curl.exe http://localhost:8787/api/health
```

До подключения YooKassa:

```json
{"ok":true,"supabaseConfigured":true,"yookassaConfigured":false,"port":8787}
```

После подключения:

```json
{"ok":true,"supabaseConfigured":true,"yookassaConfigured":true,"port":8787}
```

Можно отдельно проверить:

```powershell
curl.exe http://localhost:8787/api/payment-config
```

Ответ не раскрывает секреты:

```json
{"ok":true,"configured":true,"amountRub":499,"provider":"yookassa"}
```

## 5. Локальная тестовая оплата

Кнопка Premium отправляет пользователя на страницу подтверждения YooKassa.

После возврата AstroGuide получает `astroguide_order` и периодически вызывает `/api/payment-status`.

Это позволяет локально проверить основной цикл даже без входящего webhook.

Важно: YooKassa не сможет отправить webhook на обычный `localhost`.

## 6. Webhook для продакшена

Для настоящего запуска нужен публичный HTTPS-адрес backend.

URL webhook:

`https://YOUR_DOMAIN/api/yookassa/webhook`

В кабинете YooKassa укажите событие:

`payment.succeeded`

Backend после получения webhook **не доверяет сумме/статусу из самого webhook**. Он заново запрашивает платёж у YooKassa и только после ответа `status === "succeeded"` открывает Premium.

## 7. Важное замечание по цене

Сейчас Premium жёстко установлен в backend:

`499.00 RUB`

Это правильно для первого запуска: пользователь не может передать свою цену из браузера.

Если позже поменяем цену, меняем её только на сервере.

## 8. Что проверять перед публикацией

- HTTPS;
- отдельный production `.env`;
- реальный домен в `FRONTEND_ORIGIN`;
- webhook YooKassa на HTTPS;
- Supabase RLS;
- отсутствие `.env` в Git/ZIP;
- реальная тестовая покупка;
- проверка повторного webhook;
- проверка, что неоплативший пользователь не получает `charts.premium=true`.
