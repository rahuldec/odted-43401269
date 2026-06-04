## Findings
- There are currently **0 trainee records** in the database.
- The only role present is **admin**; there are no trainee users/roles to authenticate against.
- Trainee login expects a username to map to `username@trainee.local`, then requires a matching trainee row linked to that auth user. With no trainee account, login will always fail.

## Plan
1. **Create or repair a trainee account path**
   - Use the existing HR “Add Trainee” / “Edit Trainee” flow to ensure a trainee auth user, `trainees.auth_user_id`, and `user_roles = trainee` are created together.
   - If duplicate or missing auth-user cases exist, make the server function handle them gracefully instead of failing silently.

2. **Improve trainee login feedback**
   - Keep the current username/password login UI.
   - Return clearer messages for: invalid credentials, account exists but no trainee profile is linked, and inactive/exited trainee status.
   - Clear stale cached role data before each trainee login attempt.

3. **Verify end-to-end**
   - Create one test trainee through the HR dashboard.
   - Log out of HR.
   - Log in through Trainee Portal using that trainee username/password.
   - Confirm it lands on `/modules` and not the HR dashboard.