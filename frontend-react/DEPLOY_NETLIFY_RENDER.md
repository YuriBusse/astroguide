# AstroGuide — публикация для первых тестировщиков

## Архитектура

- Frontend: Netlify
- Backend: Render
- Auth / DB: Supabase
- Payments: YooKassa

Сначала публикуем backend, затем frontend, потому что URL backend понадобится фронтенду.

## 0. Перед публикацией

Не загружайте `.env`, `SUPABASE_SERVICE_ROLE_KEY` или `YOOKASSA_SECRET_KEY` в GitHub/Netlify.
Секреты задаются только в переменных окружения Render.

## 1. GitHub

Создайте новый приватный или публичный репозиторий и загрузите содержимое этой папки `frontend-react`.

В корне репозитория должны лежать:
- `package.json`
- `server/`
- `src/`
- `netlify.toml`
- `render.yaml`

`node_modules` загружать не нужно.

## 2. Render — backend

Создайте Web Service из этого GitHub-репозитория.

Если Render предлагает Root Directory, оставьте пустым, потому что `package.json` находится в корне репозитория.

Build Command:
`npm install`

Start Command:
`npm run server`

Health Check Path:
`/api/health`

Добавьте переменные:
- `SUPABASE_URL` = ваш Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` = секретный service-role key
- `YOOKASSA_SHOP_ID` = ID магазина
- `YOOKASSA_SECRET_KEY` = секретный ключ YooKassa
- `FRONTEND_ORIGIN` = временно `http://localhost:5173`

После Deploy получите адрес вида:
`https://astroguide-api-XXXX.onrender.com`

Проверьте:
`https://astroguide-api-XXXX.onrender.com/api/health`

Должно быть `ok: true`.

## 3. Netlify — frontend

Создайте новый сайт из того же GitHub-репозитория.

Build command:
`npm run build`

Publish directory:
`dist`

Добавьте build-time переменные:
- `VITE_SUPABASE_URL` = ваш Supabase URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = publishable key
- `VITE_ASTROGUIDE_SERVER_URL` = полный URL Render backend

После Deploy получите адрес вида:
`https://astroguide-XXXX.netlify.app`

## 4. Свяжите frontend и backend

Вернитесь в Render и замените:
`FRONTEND_ORIGIN`

на точный Netlify URL, например:
`https://astroguide-XXXX.netlify.app`

После изменения Render перезапустит сервис.

После этого:
1. Откройте сайт Netlify.
2. Зарегистрируйтесь.
3. Постройте карту.
4. Сохраните карту.
5. Откройте Premium.
6. Нажмите оплату.
7. Проверьте возврат с YooKassa.
8. Проверьте, что Premium открывается только после подтверждения платежа.

## 5. YooKassa webhook

Для первого теста возврат пользователя уже проверяет платёж через API YooKassa.

Для более надёжного production-контура после публикации добавьте webhook YooKassa:
`https://YOUR-BACKEND.onrender.com/api/yookassa/webhook`

Событие:
`payment.succeeded`

## 6. Если Netlify даст другой URL

Просто обновите `FRONTEND_ORIGIN` в Render.

`VITE_ASTROGUIDE_SERVER_URL` менять не нужно, если URL Render остался прежним.

## 7. Что отправлять друзьям

После проверки напишите им только Netlify-ссылку.

Не отправляйте:
- Render URL;
- `.env`;
- Supabase service-role key;
- YooKassa secret key.

## Быстрый smoke-test

Backend:
`GET /api/health`

Frontend:
- карта строится;
- регистрация работает;
- сохранение карты работает;
- Premium status работает;
- create-payment возвращает confirmation URL;
- после оплаты Premium становится доступен.
