import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        localStorage.removeItem("odk-auth-role");
        localStorage.removeItem("odk-auth-trainee-id");
        throw redirect({ to: "/login", search: { redirect: undefined }, replace: true });
      }
    }
    const role = getAuthRole();
    if (!role) {
      throw redirect({ to: "/login", search: { redirect: undefined }, replace: true });
    }
    if (role === "admin") {
      throw redirect({ to: "/dashboard", replace: true });
    }
    if (role === "trainee") {
      throw redirect({ to: "/modules", replace: true });
    }
  },
});
