import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useLessons, groupByModule } from "@/lib/modules";
import { useTrainees } from "@/lib/trainees";
import { useProgress, completionFor } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Okie Dokie Solutions" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { trainees } = useTrainees();
  const { lessons } = useLessons();
  const { progress } = useProgress();
  const groups = useMemo(() => groupByModule(lessons), [lessons]);

  const rows = useMemo(() => {
    return trainees.map((t) => {
      const tp = progress[t.id];
      const overall = completionFor(lessons, tp);
      const perModule = groups.map((g) => completionFor(g.lessons, tp).pct);
      return { trainee: t, overall, perModule };
    });
  }, [trainees, lessons, progress, groups]);

  function downloadCSV() {
    const head = ["Name", "Manager", "Level", "Status", "Overall %", ...groups.map((g) => g.moduleName)];
    const lines = [head.join(",")];
    rows.forEach((r) => {
      const cells = [
        `"${r.trainee.name.replace(/"/g, '""')}"`,
        `"${(r.trainee.manager || "").replace(/"/g, '""')}"`,
        `L${r.trainee.currentLevel}`,
        r.trainee.status,
        r.overall.pct,
        ...r.perModule,
      ];
      lines.push(cells.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Reports</h2>
            <p className="text-sm text-muted-foreground">Per-trainee module completion · export to CSV.</p>
          </div>
          <Button size="sm" onClick={downloadCSV} disabled={rows.length === 0}>
            <Download className="mr-1 h-4 w-4" /> Download CSV
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Trainee × module matrix</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No trainees yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainee</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>L</TableHead>
                    <TableHead>Overall</TableHead>
                    {groups.map((g) => (
                      <TableHead key={g.moduleNo} className="whitespace-nowrap">{g.moduleName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.trainee.id}>
                      <TableCell className="font-medium">{r.trainee.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.trainee.manager || "—"}</TableCell>
                      <TableCell>L{r.trainee.currentLevel}</TableCell>
                      <TableCell className="font-medium">{r.overall.pct}%</TableCell>
                      {r.perModule.map((p, i) => (
                        <TableCell key={i} className={p === 100 ? "text-level-1-foreground" : "text-muted-foreground"}>
                          {p}%
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
