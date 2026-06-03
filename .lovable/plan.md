## Plan to fix HR/admin and trainee login

### What I found
- Admin user/role exists in the database.
- There are no trainee rows yet, so trainee login cannot work until admin login works and a trainee is created.
- The admin login button spinning forever is most likely caused by the login flow awaiting session/role hydration inside the auth-state callback, creating an auth race/deadlock.
- There is also a risky server-function import pattern: `admin-trainees.functions.ts` imports the admin backend client at module scope even though the file is imported by client code. I’ll make that server-only inside handlers.

### Implementation steps
1. **Stop the login deadlock**
   - Update the root `onAuthStateChange` handler so it does not `await` database/auth calls directly inside the callback.
   - Use fire-and-forget hydration + query/router invalidation instead.

2. **Make login submit always finish**
   - Wrap admin and trainee submit handlers in `try/finally` so the spinner always stops even if a server/auth call throws.
   - Show a clear error toast when a login request fails unexpectedly.

3. **Harden role hydration**
   - Add error handling in `hydrateRoleFromSession()` so failed role/trainee lookups clear stale cached auth state instead of leaving the app half-logged-in.

4. **Fix server-only import boundary**
   - Move `supabaseAdmin` imports inside each server function/helper path in `admin-trainees.functions.ts` so the client bundle never touches the server admin client.

5. **Verify the path**
   - Confirm admin login can complete with `admin / rahul-ranger`.
   - After admin works, trainee login will require creating a trainee account first; I’ll make sure the login error state makes that clear if no trainee exists.