import { createFileRoute, useNavigate, useSearch, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loginAsAdmin,
  loginAsTraineeWithCredentials,
  getAuthRole,
} from "@/lib/auth";

import logoUrl from "@/assets/okie-dokie-logo.png";
import { Lock, GraduationCap, ShieldCheck, ArrowLeft, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    };
  },
  beforeLoad: () => {
    const role = getAuthRole();
    if (role === "admin") {
      throw redirect({ to: "/dashboard" });
    } else if (role === "trainee") {
      throw redirect({ to: "/modules" });
    }
  },
  head: () => ({
    meta: [
      { title: "Portal Selection — Okie Dokie Solutions" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [view, setView] = useState<"select" | "admin-login" | "trainee-login">("select");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTraineeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const t = await loginAsTraineeWithCredentials(username, password);
      if (t) {
        toast.success(`Welcome, ${t.name}`);
        navigate({ to: "/modules" });
      } else {
        toast.error("Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await loginAsAdmin(username, password);
      if (success) {
        toast.success("Admin access granted. Welcome back!");
        const target = search.redirect || "/dashboard";
        navigate({ to: target });
      } else {
        toast.error("Incorrect Admin ID or Password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/20 to-primary/5 px-4">
      {/* Background blobs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
      
      {view === "select" ? (
        <div className="relative w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner mb-3">
              <img src={logoUrl} alt="Okie Dokie Solutions Logo" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Okie Dokie Solutions
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Welcome to the Training Program Tracker. Please choose your portal to get started.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Trainee Option */}
            <Card
              className="group cursor-pointer border border-border/40 bg-card/60 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/5 flex flex-col justify-between"
              onClick={() => { setUsername(""); setPassword(""); setView("trainee-login"); }}
            >
              <CardHeader className="space-y-3 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">Trainee Portal</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Sign in with the credentials provided by your HR to access training videos.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  className="w-full font-medium"
                  disabled={isLoading}
                >
                  Sign in as trainee
                </Button>
              </CardContent>
            </Card>

            {/* Admin Option */}
            <Card
              className="group cursor-pointer border border-border/40 bg-card/60 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary/5 flex flex-col justify-between"
              onClick={() => { setUsername(""); setPassword(""); setView("admin-login"); }}
            >
              <CardHeader className="space-y-3 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">Management Portal</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Track trainee progress, manage profiles, promote levels, and view analytics.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full font-medium group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                  disabled={isLoading}
                >
                  Admin / HR Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="relative w-full max-w-[400px] border border-border/40 bg-card/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6">
            <button
              onClick={() => setView("select")}
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors absolute top-6 left-6"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner pt-2">
              <img src={logoUrl} alt="Okie Dokie logo" className="h-8 w-8 object-contain" />
            </div>
            <div className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {view === "admin-login" ? "Admin Login" : "Trainee Sign In"}
              </CardTitle>
              <CardDescription className="text-xs">
                {view === "admin-login"
                  ? "Enter your management credentials to access all controls"
                  : "Use the username and password your HR shared with you"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={view === "admin-login" ? handleAdminSubmit : handleTraineeSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold">
                  {view === "admin-login" ? "User ID" : "Username"}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder={view === "admin-login" ? "Enter ID" : "Your username"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-background/50 pl-9 focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 pl-9 focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full font-medium transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
