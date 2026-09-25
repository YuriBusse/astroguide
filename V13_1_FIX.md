# AstroGuide V13.1 — backend health fix

В этой версии исправлен health-check backend.

Запуск:

```powershell
cd D:\AstroGuide\frontend-react
npm.cmd run dev
```

В отдельном терминале:

```powershell
cd D:\AstroGuide\frontend-react
npm.cmd run server
```

Backend должен написать:

`AstroGuide backend listening on http://localhost:8787`

Проверка:

`http://localhost:8787/api/health`

Также доступен:

`http://localhost:8787/health`

Ожидаемый ответ:

```json
{
  "ok": true,
  "supabaseConfigured": false,
  "yookassaConfigured": false,
  "port": 8787
}
```

`false` у Supabase/ЮKassa на данном этапе нормально — это означает только, что секреты ещё не добавлены.

Если `/api/health` снова отвечает `Not found`, значит запущен не этот `server/index.js` (например, старый процесс Node). Остановите старый сервер через `Ctrl+C` и снова выполните `npm.cmd run server` из `D:\AstroGuide\frontend-react`.
