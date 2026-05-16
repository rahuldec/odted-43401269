import { createFileRoute } from "@tanstack/react-router";
import { lessonsFromCSV, SHEET_CSV_URL } from "@/lib/modules";

export const Route = createFileRoute("/api/modules-sync")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const res = await fetch(SHEET_CSV_URL, { redirect: "follow" });
          if (!res.ok) {
            return Response.json({ lessons: [], error: `Sheet HTTP ${res.status}` }, { status: 502 });
          }
          const csv = await res.text();
          const lessons = lessonsFromCSV(csv);
          return Response.json({ lessons });
        } catch (e) {
          return Response.json(
            { lessons: [], error: e instanceof Error ? e.message : "fetch failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
