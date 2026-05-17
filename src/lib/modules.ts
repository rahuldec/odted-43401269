import { useCallback, useEffect, useState } from "react";

export type Lesson = {
  id: string;
  moduleNo: number;
  moduleName: string;
  lessonName: string;
  videoUrl: string;
  assignmentUrl?: string;
  level: 0;
};

const SHEET_ID = "1gWH0Gi6aG0MdMcNA-ieJX4vlOJD6s1HfKSEFo6I92ig";
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
export const SHEET_VIEW_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;
const CACHE_KEY = "odk-modules-v1";

export const STATIC_LESSONS: Lesson[] = [
  { id: "l-1-1", moduleNo: 1, moduleName: "Basics", lessonName: "Company Overview", videoUrl: "https://drive.google.com/file/d/1TBc8FRsnBV4JAYB18IOPtndj2gpkGEiW/view", level: 0 },
  { id: "l-1-2", moduleNo: 1, moduleName: "Basics", lessonName: "Product Overview", videoUrl: "https://drive.google.com/file/d/14vS7jvhJ2eYnXDY8wh2VCi1LX21w_pul/view", level: 0 },
  { id: "l-1-3", moduleNo: 1, moduleName: "Basics", lessonName: "Basic Entity setup", videoUrl: "https://drive.google.com/file/d/1KcLOxgkaKfIla3LH_OxgvV4Tp-kmCyZm/view", assignmentUrl: "https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2026/05/sourceURL/f2b46a84853a6b39daa2-Assignment%20on%20Basic%20Entity%20setup.pdf", level: 0 },

  { id: "l-2-1", moduleNo: 2, moduleName: "SIS", lessonName: "Student List and Certificates", videoUrl: "https://drive.google.com/file/d/1CiEfjvy1246NyEqdy4DRj042Eygpsd0-/view", level: 0 },
  { id: "l-2-2", moduleNo: 2, moduleName: "SIS", lessonName: "Student Feedback, Update Scholar ID, Update Height & Weight, Assign Enrollment Number", videoUrl: "https://drive.google.com/file/d/1CiEfjvy1246NyEqdy4DRj042Eygpsd0-/view", level: 0 },
  { id: "l-2-3", moduleNo: 2, moduleName: "SIS", lessonName: "Student Promote", videoUrl: "https://drive.google.com/file/d/10xK3X9K0MATngdwzjrEbPpTiEOpGMucv/view", level: 0 },
  { id: "l-2-4", moduleNo: 2, moduleName: "SIS", lessonName: "Various Student Report and Export Data", videoUrl: "https://drive.google.com/file/d/1DljCV4SZaNylGHonRL8QB5gJh4mG7yFu/view", level: 0 },

  { id: "l-3-1", moduleNo: 3, moduleName: "Academic", lessonName: "Subject, Subject Group, Subject Grade Mapping", videoUrl: "https://drive.google.com/file/d/1aVHUYnWcGxueic1ACub5P8Jv3_nGWo1Z/view", assignmentUrl: "https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2026/05/sourceURL/a55c9828182606f1cff0-Assignment-%20Subject%20Class%20Mapping.pdf", level: 0 },
  { id: "l-3-2", moduleNo: 3, moduleName: "Academic", lessonName: "Assessment Setup", videoUrl: "https://drive.google.com/file/d/1kxlflBbTa4vvGBKOdKTf5p9CvVQAa7nV/view", assignmentUrl: "https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2025/04/sourceURL/1ec31c08f472dffdc92c-Academic%20Worksheet.pdf", level: 0 },
  { id: "l-3-3", moduleNo: 3, moduleName: "Academic", lessonName: "Assessment Group & Formula's", videoUrl: "https://drive.google.com/file/d/1qWYDfhv_wJANiBecUbJrrkAP-3NSi_yg/view", assignmentUrl: "https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2025/04/sourceURL/1ec31c08f472dffdc92c-Academic%20Worksheet.pdf", level: 0 },
  { id: "l-3-4", moduleNo: 3, moduleName: "Academic", lessonName: "Assign Subject, Assign Roll Number, Result Setup List, Remark Setup List", videoUrl: "https://drive.google.com/file/d/1z8y794vqNybg_mPCSZmQTzd2MZFRaYon/view", level: 0 },

  { id: "l-4-1", moduleNo: 4, moduleName: "Examination", lessonName: "Marks Entry", videoUrl: "https://drive.google.com/file/d/1z8y794vqNybg_mPCSZmQTzd2MZFRaYon/view", level: 0 },

  { id: "l-5-1", moduleNo: 5, moduleName: "Fee", lessonName: "Overview: Fee Head, Fee Head Group, Receipt Setting, Receipt Remark", videoUrl: "https://drive.google.com/file/d/1iw4CsVpfgOVBH3LDpG1gGWazxMpD8vy7/view", level: 0 },
  { id: "l-5-2", moduleNo: 5, moduleName: "Fee", lessonName: "Fee Category, Admission Category, Installments, Fee Group, Term Groups", videoUrl: "https://drive.google.com/file/d/1iw4CsVpfgOVBH3LDpG1gGWazxMpD8vy7/view", level: 0 },
  { id: "l-5-3", moduleNo: 5, moduleName: "Fee", lessonName: "Payment Mode, Fine Config, Miscellaneous Remark, Other Income Head, Institute Bank, Liability Heads", videoUrl: "https://drive.google.com/file/d/1Y3kwezZ2e5axXavSfO0UZRfulf-5XQzM/view", level: 0 },
  { id: "l-5-4", moduleNo: 5, moduleName: "Fee", lessonName: "Expense Management, Concession, Subject Combination", videoUrl: "https://drive.google.com/file/d/1nibTE97VePihZ5H-6GiwiSm5yRN855Nu/view", level: 0 },

  { id: "l-6-1", moduleNo: 6, moduleName: "PDF Template", lessonName: "Day 1", videoUrl: "https://drive.google.com/file/d/1X3mQjtKK4Yzmf30To9cnSSBoQPpruFQo/view", level: 0 },
  { id: "l-6-2", moduleNo: 6, moduleName: "PDF Template", lessonName: "Day 2", videoUrl: "https://drive.google.com/file/d/1ertXhu2u2nFQmJGrndElqlcdg0lVVTcW/view", level: 0 },
  { id: "l-6-3", moduleNo: 6, moduleName: "PDF Template", lessonName: "Day 3", videoUrl: "https://drive.google.com/file/d/1_qrmS7rswgP9ylg8Bhu2FlCy8yRoZB8H/view", level: 0 },
  { id: "l-6-4", moduleNo: 6, moduleName: "PDF Template", lessonName: "Day 4", videoUrl: "https://drive.google.com/file/d/1ULRUOSRQDkD5lzPDK9pBkBAOqzjGymf5/view", level: 0 },

  { id: "l-7-1", moduleNo: 7, moduleName: "Attendance", lessonName: "Student Attendance", videoUrl: "https://drive.google.com/file/d/1bjqE-b0OT5EFzzrAf0UaSON4i2DcIw6E/view", level: 0 },
  { id: "l-7-2", moduleNo: 7, moduleName: "Attendance", lessonName: "Time Table", videoUrl: "https://drive.google.com/file/d/1bjqE-b0OT5EFzzrAf0UaSON4i2DcIw6E/view", assignmentUrl: "https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2026/05/sourceURL/7b68de7d339ff13b4736-Assignment-%20Time%20Table%20Module%20Setup%20&%20Validation.pdf", level: 0 },
  { id: "l-7-3", moduleNo: 7, moduleName: "Attendance", lessonName: "Time Table Reports", videoUrl: "https://drive.google.com/file/d/1DG3xlyCk-ZFnmlFrwLiC5On-5Qy6Hg1G/view", level: 0 },
  { id: "l-7-4", moduleNo: 7, moduleName: "Attendance", lessonName: "Attendance Reports", videoUrl: "https://drive.google.com/file/d/1NJQF1J-TlWR-rq__ERGdbdtCDcMwmtmg/view", level: 0 },
  { id: "l-7-5", moduleNo: 7, moduleName: "Attendance", lessonName: "Employee Calendar List", videoUrl: "https://drive.google.com/file/d/1DG3xlyCk-ZFnmlFrwLiC5On-5Qy6Hg1G/view", level: 0 },

  { id: "l-8-1", moduleNo: 8, moduleName: "Library", lessonName: "Library Setup", videoUrl: "https://drive.google.com/file/d/1sHXiyGxxG8AnU4B6M5YpPOTSZoq_rzPa/view", level: 0 },
  { id: "l-9-1", moduleNo: 9, moduleName: "Institute Diary", lessonName: "Institute Diary", videoUrl: "https://drive.google.com/file/d/1do76EChkiisKIb4CouIjaH98AMueBGUo/view", level: 0 },
  { id: "l-10-1", moduleNo: 10, moduleName: "Zoho Forms", lessonName: "Create Forms", videoUrl: "https://drive.google.com/file/d/1K1NQMVgGUhjIAHmkX2TznynBxVHBZ1kV/view", assignmentUrl: "https://okiedokie-erp-images.s3.ap-south-1.amazonaws.com/Okie%20Dokie/2026/05/sourceURL/8ce192cc1cba1fad33f3-Zoho%20form%20setup%20checklist.pdf", level: 0 },
  { id: "l-11-1", moduleNo: 11, moduleName: "Communication", lessonName: "Communication Setup", videoUrl: "https://drive.google.com/file/d/1kP6d4cI22KAz8xfIE3dYFe7vL7ypWe4S/view", level: 0 },
];

export function driveEmbed(url: string): string {
  const m = url.match(/\/file\/d\/([^/]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : url;
}

export function groupByModule(lessons: Lesson[]) {
  const groups = new Map<number, { moduleNo: number; moduleName: string; lessons: Lesson[] }>();
  for (const l of lessons) {
    const g = groups.get(l.moduleNo) ?? { moduleNo: l.moduleNo, moduleName: l.moduleName, lessons: [] };
    g.lessons.push(l);
    groups.set(l.moduleNo, g);
  }
  return Array.from(groups.values()).sort((a, b) => a.moduleNo - b.moduleNo);
}

// --- CSV parsing for live sync ---
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(cell); cell = ""; }
      else if (c === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
      else if (c === "\r") { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length || cur.length) { cur.push(cell); rows.push(cur); }
  return rows;
}

export function lessonsFromCSV(csv: string): Lesson[] {
  const rows = parseCSV(csv).filter((r) => r.some((c) => c && c.trim()));
  if (rows.length === 0) return [];
  const out: Lesson[] = [];
  let moduleNo = 0;
  let moduleName = "";
  let idxInModule = 0;
  let day = "";
  for (let r = 1; r < rows.length; r++) {
    const [sr, mod, dayCol, lesson, link, assn] = rows[r];
    if (sr && sr.trim()) {
      moduleNo = parseInt(sr.trim(), 10) || moduleNo;
      moduleName = (mod || "").trim() || moduleName;
      idxInModule = 0;
    }
    if (dayCol && dayCol.trim()) day = dayCol.trim();
    const lessonName = (lesson || "").trim();
    const videoUrl = (link || "").trim();
    const assignmentUrl = (assn || "").trim();
    if (!lessonName || (!videoUrl && !assignmentUrl)) continue;
    idxInModule++;
    out.push({
      id: `l-${moduleNo}-${idxInModule}`,
      moduleNo,
      moduleName,
      lessonName: day ? `${day} · ${lessonName}` : lessonName,
      videoUrl,
      assignmentUrl: assignmentUrl || undefined,
      level: 0,
    });
  }
  return out;
}

type Cache = { at: number; lessons: Lesson[] };

function loadCache(): Cache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch { return null; }
}

function saveCache(lessons: Lesson[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), lessons }));
}

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>(STATIC_LESSONS);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = loadCache();
    if (c?.lessons?.length) {
      setLessons(c.lessons);
      setSyncedAt(c.at);
    }
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/modules-sync");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { lessons: Lesson[] };
      if (!data.lessons?.length) throw new Error("No lessons returned");
      setLessons(data.lessons);
      saveCache(data.lessons);
      setSyncedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  return { lessons, sync, syncing, syncedAt, error };
}
