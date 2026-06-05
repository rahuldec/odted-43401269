## Fix management login + align password validation

### 1. Fix management login bounce
In `src/routes/login.tsx`, after the one-shot sign-out triggered by `?resetSession=1`, redirect to `/login` with the param cleared so future `router.invalidate()` calls don't re-trigger sign-out.

```ts
if (search.resetSession === "1") {
  await supabase.auth.signOut();
  localStorage.removeItem("odk-auth-role");
  localStorage.removeItem("odk-auth-trainee-id");
  throw redirect({ to: "/login", search: {}, replace: true });
}
```

### 2. Raise password minimum to 6 (match Supabase)
- `src/components/AddTraineeDialog.tsx`: change `password.length < 4` → `< 6`, update error message to "at least 6 characters".
- `src/components/EditTraineeDialog.tsx`: add the same guard (currently missing) for when a new password is provided.
- `src/lib/admin-trainees.functions.ts`: change all three `z.string().min(4)` → `z.string().min(6)` (admin gate, createTrainee, updateTrainee).

### 3. Verify
- `/` → `/login` (clean URL).
- Management login with admin + password → lands on `/dashboard`, no bounce.
- Add/Edit trainee with a 5-char password → blocked client-side with clear error.
- Add/Edit trainee with a 6+ char password → succeeds.
