import { useEffect, useState, useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  createTraineeFn,
  updateTraineeFn,
  deleteTraineeFn,
  promoteTraineeFn,
} from "./admin-trainees.functions";

export type Level = 0 | 1 | 2 | 3;
export type Status = "Active" | "On Hold" | "Exited";

export type Trainee = {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  exitDate?: string;
  currentLevel: Level;
  levelSinceDate: string;
  manager: string;
  status: Status;
  notes?: string;
  username?: string;
  password?: string;
  history: { level: Level; date: string }[];
};

const ROLE_KEY = "odk-role";

export type Role = "hr" | "management";

export const LEVELS: Level[] = [0, 1, 2, 3];

export const LEVEL_INFO: Record<
  Level,
  { name: string; desc: string; tokenClass: string }
> = {
  0: { name: "Level 0", desc: "Pre-onboarding, video training", tokenClass: "bg-level-0 text-level-0-foreground" },
  1: { name: "Level 1", desc: "Ready for client calls & supporting visits", tokenClass: "bg-level-1 text-level-1-foreground" },
  2: { name: "Level 2", desc: "Solo client visits, owns small clients", tokenClass: "bg-level-2 text-level-2-foreground" },
  3: { name: "Level 3", desc: "Contributes to complex clients", tokenClass: "bg-level-3 text-level-3-foreground" },
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO?: string) {
  const from = new Date(fromISO).getTime();
  const to = toISO ? new Date(toISO).getTime() : Date.now();
  return Math.max(0, Math.floor((to - from) / (1000 * 60 * 60 * 24)));
}

export function nextLevel(level: Level): Level | null {
  return level < 3 ? ((level + 1) as Level) : null;
}

function rowToTrainee(r: Record<string, unknown>): Trainee {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: (r.phone as string) || "",
    joinDate: r.join_date as string,
    exitDate: (r.exit_date as string | null) || undefined,
    currentLevel: (r.current_level as Level) ?? 0,
    levelSinceDate: r.level_since_date as string,
    manager: (r.manager as string) || "",
    status: (r.status as Status) || "Active",
    notes: (r.notes as string) || "",
    username: (r.username as string | null) || "",
    history: ((r.history as { level: Level; date: string }[]) ?? []),
  };
}

export function useTrainees() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const createSrv = useServerFn(createTraineeFn);
  const updateSrv = useServerFn(updateTraineeFn);
  const deleteSrv = useServerFn(deleteTraineeFn);
  const promoteSrv = useServerFn(promoteTraineeFn);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("trainees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("fetch trainees failed", error);
      setTrainees([]);
    } else {
      setTrainees((data || []).map((r) => rowToTrainee(r as Record<string, unknown>)));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    refetch();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refetch();
    });
    return () => sub.subscription.unsubscribe();
  }, [refetch]);

  const add = useCallback(
    async (input: {
      name: string;
      phone: string;
      joinDate: string;
      manager: string;
      notes?: string;
      username?: string;
      password?: string;
    }) => {
      await createSrv({
        data: {
          name: input.name,
          phone: input.phone || "",
          joinDate: input.joinDate,
          manager: input.manager || "",
          notes: input.notes || "",
          username: input.username || undefined,
          password: input.password || undefined,
        },
      });
      await refetch();
    },
    [createSrv, refetch],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Trainee>) => {
      const srvPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) srvPatch.name = patch.name;
      if (patch.phone !== undefined) srvPatch.phone = patch.phone;
      if (patch.joinDate !== undefined) srvPatch.joinDate = patch.joinDate;
      if (patch.levelSinceDate !== undefined) srvPatch.levelSinceDate = patch.levelSinceDate;
      if (patch.currentLevel !== undefined) srvPatch.currentLevel = patch.currentLevel;
      if (patch.manager !== undefined) srvPatch.manager = patch.manager;
      if (patch.status !== undefined) srvPatch.status = patch.status;
      if (patch.notes !== undefined) srvPatch.notes = patch.notes;
      if (patch.username !== undefined) srvPatch.username = patch.username;
      if (patch.password !== undefined && patch.password) srvPatch.password = patch.password;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateSrv({ data: { id, patch: srvPatch as any } });
      await refetch();
    },
    [updateSrv, refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSrv({ data: { id } });
      await refetch();
    },
    [deleteSrv, refetch],
  );

  const promote = useCallback(
    async (id: string) => {
      await promoteSrv({ data: { id } });
      await refetch();
    },
    [promoteSrv, refetch],
  );

  return { trainees, hydrated, add, update, remove, promote };
}

export function useRole(): [Role, (r: Role) => void] {
  const [role, setRole] = useState<Role>("hr");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (stored === "hr" || stored === "management") setRole(stored);
  }, []);
  const update = useCallback((r: Role) => {
    setRole(r);
    if (typeof window !== "undefined") window.localStorage.setItem(ROLE_KEY, r);
  }, []);
  return [role, update];
}

export function promotedThisMonth(trainees: Trainee[]) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let count = 0;
  for (const t of trainees) {
    for (const h of t.history) {
      if (h.level === 0) continue;
      const d = new Date(h.date);
      if (d.getFullYear() === y && d.getMonth() === m) count++;
    }
  }
  return count;
}
