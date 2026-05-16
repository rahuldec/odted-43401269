import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useLessons, groupByModule } from "@/lib/modules";
import { useTrainees } from "@/lib/trainees";
import { useProgress, completionFor, isLessonComplete } from "@/lib/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Okie Dokie Solutions" }] }),
  component: AnalyticsPage,
});

const moduleCfg: ChartConfig = { pct: { label: "Avg completion %", color: "var(--chart-1)" } };
const bucketCfg: ChartConfig = { count: { label: "Trainees", color: "var(--chart-2)" } };
const mgrCfg: ChartConfig = { pct: { label: "Team avg %", color: "var(--chart-3)" } };

function AnalyticsPage() {
  const { trainees } = useTrainees();
  const { lessons } = useLessons();
  const { progress } = useProgress();
  const groups = useMemo(() => groupByModule(lessons), [lessons]);

  const moduleData = useMemo(() => {
    return groups.map((g) => {
      const totals = trainees.map((t) =>
        g.lessons.length === 0
          ? 0
          : (g.lessons.filter((l) => isLessonComplete(l, progress[t.id]?.[l.id])).length /
              g.lessons.length) * 100,
      );
      const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
      return { name: g.moduleName, pct: Math.round(avg) };
    });
  }, [groups, trainees, progress]);

  const buckets = useMemo(() => {
    const labels = ["0%", "1–24%", "25–49%", "50–74%", "75–99%", "100%"];
    const counts = [0, 0, 0, 0, 0, 0];
    trainees.forEach((t) => {
      const p = completionFor(lessons, progress[t.id]).pct;
      if (p === 0) counts[0]++;
      else if (p < 25) counts[1]++;
      else if (p < 50) counts[2]++;
      else if (p < 75) counts[3]++;
      else if (p < 100) counts[4]++;
      else counts[5]++;
    });
    return labels.map((name, i) => ({ name, count: counts[i] }));
  }, [trainees, lessons, progress]);

  const managers = useMemo(() => {
    const byMgr = new Map<string, number[]>();
    trainees.forEach((t) => {
      const k = t.manager || "Unassigned";
      const p = completionFor(lessons, progress[t.id]).pct;
      const arr = byMgr.get(k) ?? [];
      arr.push(p);
      byMgr.set(k, arr);
    });
    return Array.from(byMgr.entries())
      .map(([name, arr]) => ({ name, pct: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);
  }, [trainees, lessons, progress]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {trainees.length} trainees · {lessons.length} Level 0 lessons
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Avg completion by module</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={moduleCfg} className="h-[260px] w-full">
                <BarChart data={moduleData} margin={{ top: 8, right: 8, bottom: 32, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pct" fill="var(--color-pct)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Trainees by completion</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={bucketCfg} className="h-[260px] w-full">
                <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm">Team completion by manager</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={mgrCfg} className="h-[260px] w-full">
                <BarChart data={managers} margin={{ top: 8, right: 8, bottom: 32, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pct" fill="var(--color-pct)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
