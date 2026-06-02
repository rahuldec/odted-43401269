## Goal

Move trainee accounts off `localStorage` so a trainee can log in from any device with the credentials HR sets for them. Keep admin/HR login simple (still the `admin / rahul-ranger` hardcoded login for now).

## What changes

### 1. Database (Lovable Cloud)

Create three tables:

- **`trainees`** — name, phone, join_date, exit_date, current_level, level_since_date, manager, status, notes, history (jsonb), `auth_user_id` (uuid → auth.users), timestamps. Holds everything currently in the `Trainee` type *except* username/password.
- **`lesson_progress`** — `(trainee_id, lesson_id)` unique, `watched` bool, `watch_seconds` int, `completed_at` timestamp. Replaces the per-browser `odk-progress` localStorage object.
- **`user_roles`** — `(user_id, role)` with enum `app_role = 'admin' | 'trainee'` and a `has_role()` security-definer function. Standard Lovable pattern; lets us mark which Supabase users are HR.

RLS policies:
- Trainees: only HR/admins can insert/update/delete; a trainee can `SELECT` their own row.
- lesson_progress: a trainee can read/write only their own rows (`trainee_id` joined back via `auth_user_id = auth.uid()`); HR can read everyone's.
- user_roles: readable by the user themselves and by admins; writable only by admins.

### 2. Trainee account creation

When HR adds a trainee with a username + password, the "Add Trainee" flow:
1. Calls a `createServerFn` (admin-only) that uses `supabaseAdmin.auth.admin.createUser` with `email = <username>@trainee.local`, the chosen password, and `email_confirm: true` (no email verification needed).
2. Inserts the `trainees` row with `auth_user_id` = the new user's id.
3. Inserts a `user_roles` row with role `trainee`.

Editing a trainee's password calls another server fn that uses `supabaseAdmin.auth.admin.updateUserById`.

### 3. Login flow

- Trainee login form: take username + password, call `supabase.auth.signInWithPassword({ email: \`${username}@trainee.local\`, password })`. On success, navigate to `/modules`.
- Admin login: unchanged (still local, still `admin / rahul-ranger`) — HR isn't being migrated in this pass.

### 4. App data hooks

Rewrite the data layer to read/write Supabase instead of `localStorage`:
- `useTrainees()` → fetches `trainees` table via TanStack Query; `add`/`update`/`remove`/`promote` call server fns.
- `useProgress()` → queries `lesson_progress` for the signed-in trainee; `toggleWatched` and `addWatchSeconds` upsert rows.
- `getCurrentTraineeId()` → looks up the row where `auth_user_id = auth.uid()`.

Watch-time tracking continues to tick every second; it just upserts `watch_seconds` to the DB (debounced — flush every 10 s and on dialog close to avoid hammering the API).

### 5. One-time migration of existing local data

Add a small "Import local data → Cloud" button on the HR dashboard (visible only to admins) that reads the existing `odk-trainees` and `odk-progress` keys from localStorage and posts them to a server fn that recreates the trainees + their progress in Cloud. After the user clicks it once, they can clear it.

## What I'm NOT doing in this pass

- HR/admin accounts stay on the local `admin / rahul-ranger` check.
- No password reset emails, no "forgot password", no email verification.
- Certificates / analytics pages keep reading from the same trainees/progress hooks, so they continue to work unchanged once the hooks are swapped.

## Files touched (high-level)

- New migration creating the 3 tables + RLS + `has_role`.
- New `src/lib/trainees.functions.ts`, `src/lib/progress.functions.ts`, `src/lib/admin-trainees.functions.ts` (the last one uses `supabaseAdmin`).
- Rewrite `src/lib/trainees.ts` and `src/lib/progress.ts` hook bodies.
- Update `src/lib/auth.ts` to delegate to `supabase.auth` for trainees.
- Update `src/routes/login.tsx` (trainee submit calls Supabase).
- Update `src/components/AddTraineeDialog.tsx` + `EditTraineeDialog.tsx` to pass username/password through the new server fn.
- Update `src/start.ts` to register `attachSupabaseAuth`.
- New "Import local data" button in `HRTable.tsx`.

## Quick confirm before I build

1. **Username format** — OK to internally map `username` → `username@trainee.local` so we can reuse Supabase email/password auth? (Trainees never see this; they still type just their username.)
2. **HR/admin accounts** — leave as the current hardcoded `admin / rahul-ranger`, or also move HR to real Supabase accounts? (I'd recommend leaving it for now and doing HR in a follow-up.)
3. **Existing local data** — do you want the one-click "Import local data → Cloud" button, or are the trainees currently in localStorage disposable test data we can ignore?
