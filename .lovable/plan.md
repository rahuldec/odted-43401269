# Repoint backend to your own Supabase

You've confirmed the schema (`trainees`, `user_roles`, `lesson_progress`, `app_role` enum, `has_role` function, RLS + grants) is already in place on `rlenfsigkfxppxkskqks`. This plan does an in-place override of the env vars and regenerates the types file against your project.

## Important caveats (read first)

- Lovable Cloud stays "connected" in the project — it cannot be removed. We're just overriding the env vars it injected.
- The Cloud integration may, on some operations, rewrite `.env` / `src/integrations/supabase/*` back to its own project. If that happens, we re-apply this override.
- The Supabase tools in this chat (migrations, read_query, linter, secrets panel) will still target the Cloud project, NOT your new one. Any future schema change on your DB you'll need to run yourself via the Supabase SQL editor.
- The service role key you pasted is now in chat history — rotate it in your Supabase dashboard after we're done if you want to be safe.

## Steps

1. **Overwrite `.env`** with your project's URL + anon key (both `SUPABASE_*` and `VITE_SUPABASE_*` variants, plus the project id `rlenfsigkfxppxkskqks`).
2. **Store `SUPABASE_SERVICE_ROLE_KEY` as a secret** via the secrets tool so server functions / `client.server.ts` use your service role, not Cloud's. This requires you to confirm in the secrets dialog.
3. **Update `supabase/config.toml`** `project_id` to `rlenfsigkfxppxkskqks` so any future CLI-style operations point at your project.
4. **Regenerate `src/integrations/supabase/types.ts`** against your project. I'll fetch the types from your project's REST schema using the anon key and write them into the file (the auto-generator only runs for Cloud-managed projects, so we do it manually).
5. **Restart the dev server** so Vite picks up the new `VITE_*` values and the server runtime picks up the new secrets.
6. **Smoke test**: open `/login`, sign in as a trainee that exists in your DB, confirm the trainee dashboard loads with no 401/permission errors in the console/network panels.

## What you need to confirm before I implement

- The trainee accounts you'll test with already exist in `auth.users` AND in `public.trainees` (with `auth_user_id` linked) on your new project. The admin user (`admin@odk.local`) and its `user_roles` row also need to exist — `ensureAdminUserExists` will try to create the admin auth user on first admin login via service role, so that part can self-heal as long as the service role key is set.
- You're OK with the caveats above (Cloud stays attached, chat-side Supabase tools keep pointing at the old project).

Reply "go" and I'll execute the steps.
