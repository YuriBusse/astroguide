# AstroGuide V14 — Corrected

This version is based on AstroGuide V13.1 (the latest full UI), not the old starter project.

Changes:
- Preserved the V13.1 UI and natal chart.
- Preserved Premium sections and saved charts UI.
- Added Supabase Publishable Key support via VITE_SUPABASE_PUBLISHABLE_KEY.
- Kept backward compatibility with VITE_SUPABASE_ANON_KEY.
- Fixed cloud chart inserts to include the authenticated user_id required by RLS.
- Added automatic profile creation after Supabase signup/signin.
- No folder renaming.
- node_modules is intentionally excluded; run npm.cmd install after extraction.
