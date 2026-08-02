import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ListTodo, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.94 0.06 265 / 0.6) 0%, transparent 70%), radial-gradient(40% 30% at 80% 20%, oklch(0.9 0.09 300 / 0.4) 0%, transparent 70%)",
        }}
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Tasky</span>
        </div>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild>
              <Link to="/tasks">Open app</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}>
                Get started
              </Button>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 text-center sm:pt-24">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          A calm, focused place for your day
        </div>
        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
          The to-do list that stays out of your way.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Capture tasks in seconds, check them off with a satisfying tick, and keep your day
          moving. Your list is private and synced to your account.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {signedIn ? (
            <Button size="lg" asChild>
              <Link to="/tasks">
                <ListTodo className="mr-2 h-4 w-4" />
                Go to your tasks
              </Link>
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
              >
                Create free account
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">I already have an account</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
