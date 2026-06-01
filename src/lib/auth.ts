import type { Trainee } from "./trainees";

export type AuthRole = "admin" | "trainee";

const ROLE_KEY = "odk-auth-role";
const TRAINEE_ID_KEY = "odk-auth-trainee-id";

export function getAuthRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ROLE_KEY) as AuthRole | null;
}

export function isAuthenticated(): boolean {
  return getAuthRole() !== null;
}

export function loginAsAdmin(username: string, pass: string): boolean {
  if (username.trim() === "admin" && pass === "rahul-ranger") {
    sessionStorage.setItem(ROLE_KEY, "admin");
    return true;
  }
  return false;
}

/** Legacy: log in as a generic trainee without identity. */
export function loginAsTrainee(): void {
  sessionStorage.setItem(ROLE_KEY, "trainee");
  sessionStorage.removeItem(TRAINEE_ID_KEY);
}

/** New: log in as a specific trainee using credentials stored on their record. */
export function loginAsTraineeWithCredentials(
  username: string,
  pass: string,
  trainees: Trainee[],
): Trainee | null {
  const u = username.trim().toLowerCase();
  const match = trainees.find(
    (t) => (t.username || "").trim().toLowerCase() === u && (t.password || "") === pass,
  );
  if (!match) return null;
  sessionStorage.setItem(ROLE_KEY, "trainee");
  sessionStorage.setItem(TRAINEE_ID_KEY, match.id);
  return match;
}

export function getCurrentTraineeId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TRAINEE_ID_KEY);
}

export function logout() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(TRAINEE_ID_KEY);
}
