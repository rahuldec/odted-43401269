## Goal

Add a full Level-0 video training system to the Okie Dokie tracker. Sync 35 lessons live from your Google Sheet, let HR assign and track per-trainee progress, surface analytics/reports/certificates in a new sidebar, and block Level 0 → Level 1 promotion until every video is completed.

## New navigation

Convert the current top header into a collapsible left sidebar (keeps the existing HR/Management toggle in the header strip). Sidebar items:

- Dashboard (existing trainees board/table)
- Training Modules — browse all 11 modules / 35 lessons from the sheet
- Progress Tracker — per-trainee checklist of videos + assignment links
- Analytics — completion rates per module, per trainee, per manager
- Reports — exportable CSV of progress
- Certificates — auto-generated "Level 0 Complete" certificate (printable) when a trainee finishes 100%
- Level Reference (existing)

## Module data — live from Google Sheet

Fetch `https://docs.google.com/spreadsheets/d/1gWH0Gi6aG0MdMcNA-ieJX4vlOJD6s1HfKSEFo6I92ig/export?format=csv` on app load, parse, cache in localStorage with a 15‑minute TTL, and expose a "Sync now" button. Parsed shape per lesson:

```text
{ id, moduleNo, moduleName, lessonName, videoUrl, assignmentUrl?, level: 0 }
```

The sheet's merged "Module" cells are handled by carrying forward the last non-empty module name. Drive `…/file/d/<ID>/view` links are auto-converted to `…/preview` for inline embedding.

11 modules detected: Basics, SIS, Academic, Examination, Fee, PDF Template, Attendance, Library, Institute Diary, Zoho Forms, Communication.

## Progress tracking

Per-trainee progress stored in localStorage under `odk-progress`:

```text
{ [traineeId]: { [lessonId]: { watched: bool, assignmentDone: bool, completedAt } } }
```

A lesson counts as "complete" when watched is true AND (no assignment OR assignment marked done). Promotion rule wired into `promote()` in `src/lib/trainees.ts`: if current level is 0 and completion < 100%, throw + toast "Complete all 35 modules first".

## Pages

**Training Modules** — accordion of 11 modules → list of lessons. Click a lesson opens a dialog with embedded Drive video iframe + "Mark watched", and assignment download link + "Mark assignment done" when present. Management view = read-only.

**Progress Tracker** — trainee picker (or all). For each trainee shows progress bar, module-level breakdown, list of pending lessons. HR can tick items on behalf of a trainee.

**Analytics** — three Recharts cards: avg completion by module (bar), trainees by completion bucket 0/25/50/75/100% (bar), top managers by team completion (bar). Uses the existing chart tokens.

**Reports** — table of every trainee × overall % + per-module %, "Download CSV" button.

**Certificates** — auto-list of trainees at 100% Level-0 completion; printable certificate page styled with corporate header, trainee name, completion date, signature line.

## Design

Keeps current color tokens, level colors, card style, Inter typography. Sidebar uses the shadcn `Sidebar` component in `collapsible="icon"` mode so the page still works on the 698px viewport.

## Files

New:
- `src/components/AppSidebar.tsx`
- `src/lib/modules.ts` (CSV fetch + parse + cache)
- `src/lib/progress.ts` (progress hook + completion math + promotion guard helper)
- `src/components/LessonDialog.tsx`
- `src/components/TraineePicker.tsx`
- `src/components/CertificateCard.tsx`
- `src/routes/modules.tsx`
- `src/routes/progress.tsx`
- `src/routes/analytics.tsx`
- `src/routes/reports.tsx`
- `src/routes/certificates.tsx`

Edited:
- `src/routes/__root.tsx` — wrap in `SidebarProvider` + `AppSidebar`
- `src/lib/trainees.ts` — promotion gate from Level 0
- `src/components/AppHeader.tsx` — slim header keeping role toggle + `SidebarTrigger`

## Out of scope

- No backend / auth (still localStorage, single browser)
- No video upload — links are read from the sheet as-is
- Sheet must remain "Anyone with the link → Viewer" for CSV export to work; if it goes private the sync stops and the app falls back to the last cached copy

Approve and I'll build it.