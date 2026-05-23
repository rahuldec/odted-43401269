import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useLessons, groupByModule, type Lesson } from "@/lib/modules";
import { useRole, useTrainees, type Trainee } from "@/lib/trainees";
import { useProgress, isLessonComplete } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LessonDialog } from "@/components/LessonDialog";
import {
  CheckCircle2,
  FileText,
  PlayCircle,
  RefreshCw,
  BookOpen,
  LayoutGrid,
  PenLine,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ─── stat tile ────────────────────────────────────────────── */
function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "orange";
}) {
  return (
    <div className="od-stat">
      <div className="od-stat-icon">{icon}</div>
      <div
        className="od-stat-value"
        style={accent === "orange" ? { color: "#E05A2B" } : undefined}
      >
        {value}
      </div>
      <div className="od-stat-label">{label}</div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────── */
export function ModulesView() {
  const [role] = useRole();
  const { trainees } = useTrainees();
  const { lessons, sync, syncing, syncedAt } = useLessons();
  const { progress, setLesson } = useProgress();
  const [traineeId, setTraineeId] = useState<string>("none");
  const [active, setActive] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([1])
  );

  const groups = useMemo(() => groupByModule(lessons), [lessons]);
  const trainee: Trainee | null =
    trainees.find((t) => t.id === traineeId) ?? null;
  const tp = trainee ? progress[trainee.id] : undefined;
  const readOnly = role === "management" || !trainee;

  const totalAssn = lessons.filter((l) => l.assignmentUrl).length;
  const totalDoneLessons = trainee
    ? lessons.filter((l) => isLessonComplete(l, tp?.[l.id])).length
    : 0;
  const overallPct =
    lessons.length > 0
      ? Math.round((totalDoneLessons / lessons.length) * 100)
      : 0;

  function toggleModule(no: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(no) ? next.delete(no) : next.add(no);
      return next;
    });
  }

  return (
    <AppShell>
      <style>{`
        .od-page { display: flex; flex-direction: column; gap: 0; }

        /* ── header ── */
        .od-header {
          background: #fff;
          border-bottom: 0.5px solid #e8e6e0;
          padding: 20px 28px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .od-header-left h1 {
          font-size: 22px; font-weight: 600; color: #1a1a18;
          margin: 0 0 3px; letter-spacing: -0.3px;
        }
        .od-header-left p { font-size: 13px; color: #888780; margin: 0; }
        .od-header-right { display: flex; align-items: center; gap: 10px; }
        .od-sync-chip {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #5F5E5A;
          background: #F1EFE8; padding: 5px 12px; border-radius: 20px;
        }
        .od-sync-dot { width: 6px; height: 6px; border-radius: 50%; background: #3B6D11; flex-shrink: 0; }
        .od-sync-btn {
          display: flex; align-items: center; gap: 6px;
          background: #E05A2B; color: #fff; border: none;
          font-size: 13px; font-weight: 500;
          padding: 7px 14px; border-radius: 9px; cursor: pointer;
        }
        .od-sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── stats bar ── */
        .od-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e8e6e0;
          border-bottom: 0.5px solid #e8e6e0;
        }
        .od-stat {
          background: #fff; padding: 16px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .od-stat-icon { color: #D3D1C7; margin-bottom: 2px; }
        .od-stat-value { font-size: 22px; font-weight: 600; color: #1a1a18; line-height: 1; }
        .od-stat-label { font-size: 12px; color: #888780; }

        /* ── overall progress bar ── */
        .od-progress-row {
          background: #fff;
          border-bottom: 0.5px solid #e8e6e0;
          padding: 12px 28px;
          display: flex; align-items: center; gap: 14px;
        }
        .od-progress-label { font-size: 12px; color: #5F5E5A; white-space: nowrap; font-weight: 500; }
        .od-progress-track { flex: 1; background: #F1EFE8; border-radius: 99px; height: 6px; }
        .od-progress-fill { height: 6px; border-radius: 99px; background: #E05A2B; transition: width 0.4s ease; }
        .od-progress-pct { font-size: 12px; font-weight: 600; color: #E05A2B; min-width: 34px; text-align: right; }

        /* ── trainee selector ── */
        .od-selector-bar {
          background: #F7F6F3;
          border-bottom: 0.5px solid #e8e6e0;
          padding: 12px 28px;
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .od-selector-label { font-size: 12px; color: #5F5E5A; font-weight: 500; }
        .od-sync-time { font-size: 11px; color: #B4B2A9; }

        /* ── module grid ── */
        .od-body { padding: 24px 28px; background: #F7F6F3; }
        .od-section-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .od-section-bar h2 { font-size: 15px; font-weight: 600; color: #1a1a18; }
        .od-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }

        /* ── module card ── */
        .od-card {
          background: #fff;
          border: 0.5px solid #e8e6e0;
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.15s, transform 0.15s;
        }
        .od-card:hover { border-color: #E05A2B; transform: translateY(-1px); }
        .od-card-bar { height: 3px; background: #F1EFE8; transition: background 0.15s; }
        .od-card:hover .od-card-bar { background: #E05A2B; }
        .od-card-bar.done { background: #E05A2B; }
        .od-card-inner { padding: 16px 18px; }
        .od-card-top {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 12px;
        }
        .od-mod-num {
          font-size: 10px; font-weight: 600; color: #B4B2A9;
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .od-card-badges { display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
        .od-badge {
          font-size: 10px; font-weight: 500;
          padding: 2px 8px; border-radius: 20px;
          display: flex; align-items: center; gap: 3px;
        }
        .od-badge-assn { background: #FEF0E9; color: #993C1D; }
        .od-badge-count { background: #F1EFE8; color: #5F5E5A; }
        .od-card-title { font-size: 15px; font-weight: 600; color: #1a1a18; margin-bottom: 2px; }
        .od-card-desc { font-size: 12px; color: #888780; margin-bottom: 14px; }
        .od-prog-track { background: #F1EFE8; border-radius: 99px; height: 4px; margin-bottom: 5px; }
        .od-prog-fill { height: 4px; border-radius: 99px; background: #E05A2B; transition: width 0.3s; }
        .od-prog-meta {
          display: flex; justify-content: space-between;
          font-size: 11px; color: #B4B2A9; margin-bottom: 12px;
        }
        .od-lesson-list {
          border-top: 0.5px solid #F1EFE8; padding-top: 10px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .od-lesson-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: #5F5E5A;
          padding: 3px 0; cursor: pointer;
          border-radius: 6px; transition: background 0.1s;
        }
        .od-lesson-row:hover { background: #F7F6F3; padding-left: 4px; }
        .od-card-footer {
          display: flex; align-items: center; justify-content: flex-start;
          border-top: 0.5px solid #F1EFE8;
          padding: 10px 18px;
          background: #FAFAF8;
        }
        .od-expand-btn {
          font-size: 12px; color: #E05A2B; font-weight: 500;
          display: flex; align-items: center; gap: 3px;
          background: none; border: none; cursor: pointer; padding: 0;
        }
      `}</style>

      <div className="od-page">

        {/* ── Header ── */}
        <div className="od-header">
          <div className="od-header-left">
            <h1>Training modules</h1>
            <p>
              {lessons.length} lessons across {groups.length} modules ·{" "}
              {totalAssn} assignments · synced from Google Sheet
            </p>
          </div>
          <div className="od-header-right">
            <div className="od-sync-chip">
              <div className="od-sync-dot" />
              {syncedAt
                ? `Synced · ${new Date(syncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Not synced"}
            </div>
            <button className="od-sync-btn" onClick={sync} disabled={syncing}>
              <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync sheet"}
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="od-stats">
          <StatTile icon={<LayoutGrid size={16} />} label="Modules" value={groups.length} />
          <StatTile icon={<BookOpen size={16} />} label="Lessons" value={lessons.length} />
          <StatTile icon={<PenLine size={16} />} label="Assignments" value={totalAssn} accent="orange" />
          <StatTile icon={<CheckCircle2 size={16} />} label="Completed" value={totalDoneLessons} />
        </div>

        {/* ── Overall progress bar (trainee selected) ── */}
        {trainee && (
          <div className="od-progress-row">
            <span className="od-progress-label">Overall progress</span>
            <div className="od-progress-track">
              <div className="od-progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="od-progress-pct">{overallPct}%</span>
          </div>
        )}

        {/* ── Trainee selector (HR only) ── */}
        {role === "hr" && (
          <div className="od-selector-bar">
            <span className="od-selector-label">Track trainee</span>
            <Select value={traineeId} onValueChange={setTraineeId}>
              <SelectTrigger className="w-[240px] h-8 text-sm">
                <SelectValue placeholder="Browse only (no trainee)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Browse only</SelectItem>
                {trainees
                  .filter((t) => t.currentLevel === 0)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.manager || "—"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {syncedAt && (
              <span className="od-sync-time">
                Last synced {new Date(syncedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* ── Module cards grid ── */}
        <div className="od-body">
          <div className="od-section-bar">
            <h2>All modules</h2>
            <span style={{ fontSize: 12, color: "#B4B2A9" }}>
              {groups.length} modules · click card to expand
            </span>
          </div>

          <div className="od-grid">
            {groups.map((g) => {
              const done = g.lessons.filter((l) =>
                isLessonComplete(l, tp?.[l.id])
              ).length;
              const pct =
                g.lessons.length > 0
                  ? Math.round((done / g.lessons.length) * 100)
                  : 0;
              const expanded = expandedModules.has(g.moduleNo);
              const hasAssn = g.lessons.some((l) => l.assignmentUrl);

              return (
                <div key={g.moduleNo} className="od-card">
                  <div className={`od-card-bar${done === g.lessons.length && done > 0 ? " done" : ""}`} />
                  <div className="od-card-inner">
                    <div className="od-card-top">
                      <span className="od-mod-num">
                        Module {String(g.moduleNo).padStart(2, "0")}
                      </span>
                      <div className="od-card-badges">
                        {hasAssn && (
                          <span className="od-badge od-badge-assn">
                            <FileText size={9} /> Assignment
                          </span>
                        )}
                        <span className="od-badge od-badge-count">
                          {g.lessons.length} lessons
                        </span>
                      </div>
                    </div>

                    <div className="od-card-title">{g.moduleName}</div>
                    <div className="od-card-desc">
                      {g.lessons.map((l) => l.lessonName).slice(0, 2).join(", ")}
                      {g.lessons.length > 2 && " …"}
                    </div>

                    <div className="od-prog-track">
                      <div className="od-prog-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="od-prog-meta">
                      <span>{done === 0 ? "Not started" : `${done} done`}</span>
                      <span>{done}/{g.lessons.length}</span>
                    </div>

                    {/* expandable lesson list */}
                    {expanded && (
                      <div className="od-lesson-list">
                        {g.lessons.map((l) => {
                          const lp = tp?.[l.id];
                          const complete = isLessonComplete(l, lp);
                          return (
                            <div
                              key={l.id}
                              className="od-lesson-row"
                              onClick={() => setActive(l)}
                            >
                              {complete ? (
                                <CheckCircle2 size={13} style={{ color: "#E05A2B", flexShrink: 0 }} />
                              ) : (
                                <PlayCircle size={13} style={{ color: "#D3D1C7", flexShrink: 0 }} />
                              )}
                              <span style={{ flex: 1 }}>{l.lessonName}</span>
                              {l.assignmentUrl && (
                                <Badge variant="outline" className="gap-1 text-[10px] h-4">
                                  <FileText size={9} /> Assn
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="od-card-footer">
                    <button
                      className="od-expand-btn"
                      onClick={() => toggleModule(g.moduleNo)}
                    >
                      {expanded ? (
                        <><ChevronUp size={13} /> Hide lessons</>
                      ) : (
                        <><ChevronDown size={13} /> Show lessons</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lesson dialog (unchanged) ── */}
      <LessonDialog
        lesson={active}
        trainee={trainee}
        progress={active && trainee ? tp?.[active.id] : undefined}
        readOnly={readOnly}
        onClose={() => setActive(null)}
        onToggleWatched={() => {
          if (!active || !trainee) return;
          setLesson(trainee.id, active.id, { watched: !tp?.[active.id]?.watched });
        }}
        onToggleAssignment={() => {
          if (!active || !trainee) return;
          setLesson(trainee.id, active.id, { assignmentDone: !tp?.[active.id]?.assignmentDone });
        }}
      />
    </AppShell>
  );
}