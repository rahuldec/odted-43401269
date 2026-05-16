import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LEVELS, LEVEL_INFO } from "@/lib/trainees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "Level Reference — Okie Dokie Solutions" },
      {
        name: "description",
        content:
          "Reference for the four training levels at Okie Dokie Solutions, including pay and responsibilities.",
      },
    ],
  }),
  component: LevelsPage,
});

function LevelsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Level Reference</h2>
          <p className="text-sm text-muted-foreground">
            Pay and responsibilities for each level of the training program.
          </p>
        </div>
        <div className="grid gap-3">
          {LEVELS.map((l) => {
            const info = LEVEL_INFO[l];
            return (
              <Card key={l}>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <span
                    className={`inline-flex h-10 min-w-16 items-center justify-center rounded-md text-sm font-semibold ${info.tokenClass}`}
                  >
                    L{l}
                  </span>
                  <CardTitle className="text-lg">
                    {info.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{info.desc}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
