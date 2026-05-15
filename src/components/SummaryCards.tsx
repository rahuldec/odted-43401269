import { Card, CardContent } from "@/components/ui/card";
import { LEVELS, LEVEL_INFO, promotedThisMonth, type Trainee } from "@/lib/trainees";
import { Users, TrendingUp } from "lucide-react";

export function SummaryCards({ trainees }: { trainees: Trainee[] }) {
  const total = trainees.length;
  const promoted = promotedThisMonth(trainees);
  const counts = LEVELS.map((l) => ({
    level: l,
    count: trainees.filter((t) => t.currentLevel === l).length,
  }));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-2xl font-semibold">{total}</div>
            <div className="text-xs text-muted-foreground">Total trainees</div>
          </div>
        </CardContent>
      </Card>
      {counts.map(({ level, count }) => (
        <Card key={level}>
          <CardContent className="p-4">
            <span
              className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${LEVEL_INFO[level].tokenClass}`}
            >
              LEVEL {level}
            </span>
            <div className="mt-2 text-2xl font-semibold">{count}</div>
            <div className="text-xs text-muted-foreground">{LEVEL_INFO[level].pay}</div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-2xl font-semibold">{promoted}</div>
            <div className="text-xs text-muted-foreground">Promoted this month</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
