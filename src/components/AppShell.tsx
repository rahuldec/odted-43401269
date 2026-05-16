import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useRole, type Role } from "@/lib/trainees";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children }: { children: ReactNode }) {
  const [role, setRole] = useRole();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-card/80 px-3 backdrop-blur sm:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold leading-tight">Okie Dokie Solutions</h1>
                <p className="text-[11px] text-muted-foreground">Training Program Tracker</p>
              </div>
            </div>
            <div className="inline-flex rounded-md border bg-background p-1">
              {(["hr", "management"] as Role[]).map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant="ghost"
                  onClick={() => setRole(r)}
                  className={cn(
                    "h-7 px-2.5 text-xs font-medium",
                    role === r &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  {r === "hr" ? "HR" : "Management"}
                </Button>
              ))}
            </div>
          </header>
          <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6">{children}</main>
          <Toaster />
        </div>
      </div>
    </SidebarProvider>
  );
}
