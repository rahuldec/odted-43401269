import { createFileRoute } from "@tanstack/react-router";
import { ModulesView } from "@/components/ModulesView";

export const Route = createFileRoute("/training")({
  head: () => ({ meta: [{ title: "Training Module — Okie Dokie Solutions" }] }),
  component: ModulesView,
});
