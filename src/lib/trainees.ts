import { useEffect, useState, useCallback } from "react";

export type Level = 0 | 1 | 2 | 3;
export type Status = "Active" | "On Hold" | "Exited";

export type Trainee = {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  currentLevel: Level;
  levelSinceDate: string;
  manager: string;
  status: Status;
  notes?: string;
  history: { level: Level; date: string }[];
};

const TRAINEES_KEY = "odk-trainees";
const ROLE_KEY = "odk-role";

export type Role = "hr" | "management";

export const LEVELS: Level[] = [0, 1, 2, 3];

export const LEVEL_INFO: Record<
  Level,
  { name: string; pay: string; desc: string; tokenClass: string }
> = {
  0: {
    name: "Level 0",
    pay: "₹0/month",
    desc: "Pre-onboarding, video training",
    tokenClass: "bg-level-0 text-level-0-foreground",
  },
  1: {
    name: "Level 1",
    pay: "₹8,000/month",
    desc: "Ready for client calls & supporting visits",
    tokenClass: "bg-level-1 text-level-1-foreground",
  },
  2: {
    name: "Level 2",
    pay: "₹10,000/month",
    desc: "Solo client visits, owns small clients",
    tokenClass: "bg-level-2 text-level-2-foreground",
  },
  3: {
    name: "Level 3",
    pay: "₹12,000/month",
    desc: "Contributes to complex clients",
    tokenClass: "bg-level-3 text-level-3-foreground",
  },
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

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function load(): Trainee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRAINEES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Trainee[];
  } catch {
    return [];
  }
}

function save(list: Trainee[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAINEES_KEY, JSON.stringify(list));
}

export function useTrainees() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTrainees(load());
    setHydrated(true);
  }, []);

  const persist = useCallback((updater: (prev: Trainee[]) => Trainee[]) => {
    setTrainees((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (input: { name: string; phone: string; joinDate: string; manager: string; notes?: string }) => {
      const t: Trainee = {
        id: uid(),
        name: input.name.trim(),
        phone: input.phone.trim(),
        joinDate: input.joinDate,
        currentLevel: 0,
        levelSinceDate: input.joinDate,
        manager: input.manager.trim(),
        status: "Active",
        notes: input.notes?.trim() || "",
        history: [{ level: 0, date: input.joinDate }],
      };
      persist((p) => [t, ...p]);
    },
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<Trainee>) => {
      persist((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist((p) => p.filter((t) => t.id !== id)),
    [persist],
  );

  const promote = useCallback(
    (id: string) => {
      persist((p) =>
        p.map((t) => {
          if (t.id !== id) return t;
          const nl = nextLevel(t.currentLevel);
          if (nl === null) return t;
          const date = todayISO();
          return {
            ...t,
            currentLevel: nl,
            levelSinceDate: date,
            history: [...t.history, { level: nl, date }],
          };
        }),
      );
    },
    [persist],
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
