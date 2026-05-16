import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useLessons } from "@/lib/modules";
import { useTrainees, type Trainee } from "@/lib/trainees";
import { useProgress, completionFor } from "@/lib/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Printer, Building2 } from "lucide-react";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — Okie Dokie Solutions" }] }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { trainees } = useTrainees();
  const { lessons } = useLessons();
  const { progress } = useProgress();

  const eligible = useMemo(() => {
    return trainees
      .map((t) => ({ trainee: t, c: completionFor(lessons, progress[t.id]) }))
      .filter((r) => r.c.total > 0 && r.c.pct === 100);
  }, [trainees, lessons, progress]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Certificates</h2>
          <p className="text-sm text-muted-foreground">
            Auto-issued to trainees who complete 100% of Level 0 training.
          </p>
        </div>
        {eligible.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Award className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No certificates yet — finish all {lessons.length} Level 0 lessons to unlock one.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {eligible.map((r) => (
              <Certificate key={r.trainee.id} trainee={r.trainee} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Certificate({ trainee }: { trainee: Trainee }) {
  const issuedOn = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          id={`cert-${trainee.id}`}
          className="relative space-y-4 border-b bg-gradient-to-br from-card to-muted/40 p-6 text-center print:border-0"
        >
          <div className="flex items-center justify-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Okie Dokie Solutions</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Certificate of Completion</p>
            <h3 className="mt-2 text-xl font-semibold">{trainee.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              has successfully completed all Level 0 training modules of the
              Okie Dokie ERP & Campus Automation onboarding program.
            </p>
          </div>
          <div className="mx-auto flex max-w-xs items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">{issuedOn}</p>
              <p>Issued</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-foreground">{trainee.manager || "HR"}</p>
              <p>Signed</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end p-3">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
