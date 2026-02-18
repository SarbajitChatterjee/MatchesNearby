/**
 * Auth — login / signup / guest bypass page.
 *
 * Currently a UI shell with no real auth backend wired up.
 * The form handlers store a dummy session token in localStorage
 * so the auth gate in App.tsx allows entry.
 *
 * Guest bypass:
 * "Continue as Guest" sets a "guest" session token, letting
 * users explore the app without creating an account.
 *
 * When real auth is added (e.g. Supabase Auth), replace the
 * handleSubmit and handleGuest functions with actual API calls.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthProps {
  onAuthenticated: () => void;
}

type Mode = "login" | "signup";

export default function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire real auth — replace with actual API call
    localStorage.setItem("mn_session", "1");
    onAuthenticated();
  };

  const handleGuest = () => {
    localStorage.setItem("mn_session", "guest");
    onAuthenticated();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-md pb-2xl">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Match<span className="text-accent">Nearby</span>
          </h1>
          <p className="mt-xs text-sm text-muted-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-xs">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {mode === "login" ? "Log in" : "Sign up"}
          </Button>
        </form>

        <div className="mt-md flex flex-col items-center gap-sm">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm text-accent hover:underline"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>

          <div className="flex items-center gap-sm text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" onClick={handleGuest} className="w-full">
            Continue as Guest
          </Button>
        </div>
      </div>
    </div>
  );
}
