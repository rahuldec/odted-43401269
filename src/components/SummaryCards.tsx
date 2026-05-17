import { LEVELS, LEVEL_INFO, promotedThisMonth, type Trainee } from "@/lib/trainees";
import { Users, TrendingUp } from "lucide-react";

function Stat({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: React.ReactNode;
}) {
  return (
    <div className="apple-surface group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ?? accent}
      </div>
      <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight">{value}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SummaryCards({ trainees }: { trainees: Trainee[] }) {
  const total = trainees.length;
  const promoted = promotedThisMonth(trainees);
  const counts = LEVELS.map((l) => ({
    level: l,
    count: trainees.filter((t) => t.currentLevel === l).length,
  }));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Stat
        label="Total"
        value={total}
        hint="Trainees in program"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      {counts.map(({ level, count }) => (
        <Stat
          key={level}
          label={`Level ${level}`}
          value={count}
          hint={LEVEL_INFO[level].desc}
          accent={
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
              style={{ background: `var(--level-${level})` }}
            />
          }
        />
      ))}
      <Stat
        label="Promoted"
        value={promoted}
        hint="This month"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
