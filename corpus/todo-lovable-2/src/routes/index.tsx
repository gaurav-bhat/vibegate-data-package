import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tally — a clean, personal to-do list" },
      { name: "description", content: "Tally is a minimal to-do app. Sign up, capture what matters, and check things off." },
      { property: "og:title", content: "Tally — a clean, personal to-do list" },
      { property: "og:description", content: "Tally is a minimal to-do app. Sign up, capture what matters, and check things off." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tasks", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Tally</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">Sign in</Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            A quiet place<br />for your to-dos.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Tally is a minimal to-do list. No projects, no tags, no clutter — just the things you need to do.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="h-11 px-6">Get started</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="ghost" className="h-11 px-6">Sign in</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Tally
      </footer>
    </div>
  );
}
