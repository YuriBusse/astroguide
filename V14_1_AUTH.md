# AstroGuide V14.1 — Auth + My Charts

This build keeps the current AstroGuide interface and adds the next account step.

## Included
- Supabase Auth using the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY variables.
- Cloud profile creation in `profiles`.
- Cloud chart saving in `charts` with the existing RLS policies.
- Cloud chart loading/deletion.
- "Открыть" for saved charts: the selected chart is restored in the calculator and recalculated.
- Existing backend remains unchanged and continues to use dotenv.

## Environment
Create `D:\AstroGuide\frontend-react\.env` locally. Do not include it in the ZIP.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

The secret key is server-only and must never be committed or sent to chat.

## Run
```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run server
```
