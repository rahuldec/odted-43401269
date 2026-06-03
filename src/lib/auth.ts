import { supabase } from "@/integrations/supabase/client";
import { ensureAdminUserExists } from "./admin-trainees.functions";

export type AuthRole = "admin" | "trainee";

const ROLE_KEY = "odk-auth-role";
const TRAINEE_ID_KEY = "odk-auth-trainee-id";

const ADMIN_EMAIL = "admin@odk.local";
const TRAINEE_EMAIL_DOMAIN = "trainee.local";

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${TRAINEE_EMAIL_DOMAIN}`;
}

export function getAuthRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY) as AuthRole | null;
}

export function getCurrentTraineeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TRAINEE_ID_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthRole() !== null;
}

function setRoleCache(role: AuthRole | null, traineeId: string | null) {
  if (typeof window === "undefined") return;
  if (role) localStorage.setItem(ROLE_KEY, role);
  else localStorage.removeItem(ROLE_KEY);
  if (traineeId) localStorage.setItem(TRAINEE_ID_KEY, traineeId);
  else localStorage.removeItem(TRAINEE_ID_KEY);
}

/** Re-derive role + trainee mapping from the current Supabase session. */
export async function hydrateRoleFromSession(): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setRoleCache(null, null);
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roles || []).some((r) => r.role === "admin");
    if (isAdmin) {
      setRoleCache("admin", null);
      return;
    }
    const { data: trainee } = await supabase
      .from("trainees")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (trainee) {
      setRoleCache("trainee", trainee.id);
    } else {
      setRoleCache(null, null);
    }
  } catch (e) {
    console.error("hydrateRoleFromSession failed", e);
    setRoleCache(null, null);
  }
}


export async function loginAsAdmin(username: string, password: string): Promise<boolean> {
  if (username.trim() !== "admin") return false;
  try {
    await ensureAdminUserExists({ data: { password } });
  } catch (e) {
    console.error("ensureAdminUserExists failed", e);
    return false;
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  });
  if (error) {
    console.error("admin signIn failed", error);
    return false;
  }
  await hydrateRoleFromSession();
  return true;
}

export async function loginAsTraineeWithCredentials(
  username: string,
  password: string,
): Promise<{ id: string; name: string } | null> {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return null;
  await hydrateRoleFromSession();
  const { data: t } = await supabase
    .from("trainees")
    .select("id, name")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  return t ?? null;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  setRoleCache(null, null);
}
