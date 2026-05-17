import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";

import { SummaryCards } from "@/components/SummaryCards";
import { KanbanBoard } from "@/components/KanbanBoard";
import { HRTable } from "@/components/HRTable";
import { AddTraineeDialog } from "@/components/AddTraineeDialog";
import { useRole, useTrainees } from "@/lib/trainees";
import { useLessons } from "@/lib/modules";
import { useProgress, completionFor } from "@/lib/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Training Program Tracker — Okie Dokie Solutions" },
      {
        name: "description",
        content:
          "Internal HR & management dashboard for tracking trainees through Okie Dokie Solutions' training program.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [role] = useRole();
  const { trainees, hydrated, add, update, remove, promote } = useTrainees();
  const { lessons } = useLessons();
  const { progress } = useProgress();
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const managers = useMemo(() => {
    const set = new Set<string>();
    trainees.forEach((t) => t.manager && set.add(t.manager));
    return Array.from(set).sort();
  }, [trainees]);

  const filtered = useMemo(() => {
    return trainees.filter((t) => {
      if (managerFilter !== "all" && t.manager !== managerFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      return true;
    });
  }, [trainees, managerFilter, statusFilter]);

  function guardedPromote(id: string) {
    const t = trainees.find((x) => x.id === id);
    if (t && t.currentLevel === 0) {
      const c = completionFor(lessons, progress[t.id]);
      if (c.pct < 100) {
        toast.error(
          `Complete all ${c.total} Level 0 modules first (${c.done}/${c.total} done)`,
        );
        return;
      }
    }
    promote(id);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {role === "hr" ? "Human Resources" : "Management"}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {role === "hr" ? "Dashboard" : "Overview"}
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              {role === "hr"
                ? "Add, promote and manage trainees through the program."
                : "Read-only view of all trainees and their progress."}
            </p>
          </div>
          {role === "hr" && hydrated && <AddTraineeDialog onAdd={add} />}
        </div>

        <SummaryCards trainees={trainees} />

        {role === "management" && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Filter by manager</Label>
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All managers</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Filter by status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Exited">Exited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {role === "hr" ? (
          <HRTable
            trainees={trainees}
            onUpdate={update}
            onPromote={guardedPromote}
            onRemove={remove}
            lessons={lessons}
            progress={progress}
          />
        ) : (
          <KanbanBoard trainees={filtered} lessons={lessons} progress={progress} />
        )}
      </div>
    </AppShell>
  );
}
