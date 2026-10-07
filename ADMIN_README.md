# Read-only admin panel

Локальная админ-панель доступна по `#/admin` и защищена сервером.

Чтобы назначить администратора, добавьте в backend environment:

```env
ASTROGUIDE_ADMIN_USER_IDS=<AstroGuide user id>
```

Можно указать несколько ID через запятую. ID нужно брать из существующей авторизованной сессии пользователя или безопасного server-side источника, не публикуя service-role key и другие секреты.

Панель доступна только пользователям из server-side allowlist. `localStorage`, query-параметры и client-side флаги не дают доступ.

Первая версия read-only: просмотр не меняет пользователей, карты, Premium, платежи, рефералы или free-analysis ledger.
