import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Sparkles, Zap, Lock, Layers, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowNote — Notes that think with you" },
      {
        name: "description",
        content:
          "FlowNote is the calm, AI-native notebook for people who make things. Join the waitlist for early access.",
      },
      { property: "og:title", content: "FlowNote — Notes that think with you" },
      {
        property: "og:description",
        content:
          "The calm, AI-native notebook for people who make things. Join the waitlist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Please enter a valid email address" })
  .max(255);

const features = [
  {
    icon: Sparkles,
    title: "Ambient AI",
    body: "Summaries, follow-ups, and rewrites appear inline — never in your way.",
  },
  {
    icon: Layers,
    title: "Infinite canvas",
    body: "Blocks that nest, link, and connect. Structure emerges as you write.",
  },
  {
    icon: Zap,
    title: "Instant capture",
    body: "Global hotkey, voice memos, and a lightning-fast quick note.",
  },
  {
    icon: Lock,
    title: "Yours alone",
    body: "End-to-end encrypted. Your ideas never train anyone else's model.",
  },
];

function Landing() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setStatus("loading");
    const { error } = await supabase
      .from("waitlist_signups")
      .insert({ email: parsed.data.toLowerCase() });
    if (error) {
      if (error.code === "23505") {
        setStatus("done");
        toast.success("You're already on the list!");
      } else {
        setStatus("idle");
        toast.error("Something went wrong. Try again.");
      }
      return;
    }
    setStatus("done");
    toast.success("You're in. We'll be in touch.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FlowNote</span>
        </div>
        <a
          href="#waitlist"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Join waitlist
        </a>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-secondary-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Now inviting the first 1,000 makers
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
              Notes that think{" "}
              <span className="text-primary">with you</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground md:text-xl">
              FlowNote is the calm, AI-native notebook for people who make
              things. Capture fast. Connect ideas. Ship sooner.
            </p>

            <form
              id="waitlist"
              onSubmit={onSubmit}
              className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status !== "idle"}
                className="h-12 flex-1 bg-card"
                aria-label="Email address"
              />
              <Button
                type="submit"
                disabled={status !== "idle"}
                className="h-12 px-6 text-base"
              >
                {status === "done" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    You're in
                  </>
                ) : status === "loading" ? (
                  "Joining…"
                ) : (
                  "Join waitlist"
                )}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              No spam. One email when we open the doors.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card/50">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Built for the way ideas actually happen.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Not another block editor. A workspace that gets out of the way.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FlowNote</span>
          <span>Made for makers.</span>
        </div>
      </footer>
    </div>
  );
}
