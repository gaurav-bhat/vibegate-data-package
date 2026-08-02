import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/tasks" });
  },
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            Tally
          </div>
          <Link
            to="/auth"
            className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Simple. Focused. Yours.
          </span>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            The todo list that <span className="text-accent">gets out of the way.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground">
            A clean space for the things you need to do. Add a task, check it off, move on.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
            >
              Get started — it's free
            </Link>
          </div>
        </section>

        <footer className="pt-8 text-center text-xs text-muted-foreground">
          Built with care.
        </footer>
      </div>
    </main>
  );
}
