import { LEVEL_INFO, LEVELS } from "@/lib/trainees";
import { Card, CardContent } from "@/components/ui/card";

export function LevelLegend() {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {LEVELS.map((lvl) => {
          const info = LEVEL_INFO[lvl];
          return (
            <div key={lvl} className="flex items-start gap-3 rounded-md border p-3">
              <span
                className={`inline-flex h-8 min-w-12 items-center justify-center rounded-md px-2 text-xs font-semibold ${info.tokenClass}`}
              >
                L{lvl}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {info.name}
                </div>
                <div className="text-xs text-muted-foreground">{info.desc}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
