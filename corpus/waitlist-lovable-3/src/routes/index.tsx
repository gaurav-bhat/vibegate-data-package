import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import { ArrowRight, Sparkles, Zap, Layers, Users, Check } from "lucide-react";
import { joinWaitlist } from "@/lib/waitlist.functions";
import heroImg from "@/assets/flownote-hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "FlowNote — Notes that think with you" },
      {
        name: "description",
        content:
          "FlowNote is a calm, AI-native workspace for notes, ideas and daily flow. Join the private waitlist.",
      },
      { property: "og:title", content: "FlowNote — Notes that think with you" },
      {
        property: "og:description",
        content:
          "A calm, AI-native workspace for notes, ideas and daily flow. Join the private waitlist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const features = [
  {
    icon: Sparkles,
    title: "AI that stays out of the way",
    body: "Summarize, restructure and connect notes on demand — never uninvited. Your voice stays yours.",
  },
  {
    icon: Layers,
    title: "One canvas for everything",
    body: "Docs, tasks, whiteboards and bookmarks live side by side. No more twelve tabs to find one thought.",
  },
  {
    icon: Zap,
    title: "Fast on the worst day",
    body: "Local-first sync, keyboard driven, sub-30ms interactions. Built for the moments you don't have time.",
  },
  {
    icon: Users,
    title: "Shared, not scattered",
    body: "Invite a teammate to a single page or a whole space. Presence and comments feel like the same room.",
  },
];

function Landing() {
  const submit = useServerFn(joinWaitlist);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await submit({ data: { email: trimmed } });
      setJoined(true);
      toast.success(res.already ? "You're already on the list." : "You're on the list.");
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg.includes("email") ? "Please enter a valid email." : "Couldn't sign you up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg">
            F
          </div>
          <span className="font-display text-xl">FlowNote</span>
        </div>
        <a
          href="#waitlist"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Join waitlist →
        </a>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-10 pb-24 md:pt-20 md:pb-32">
        <div className="grid gap-14 md:grid-cols-[1.15fr_1fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              Private beta — Fall 2026
            </div>
            <h1 className="mt-6 text-5xl leading-[1.02] md:text-7xl">
              Notes that <em className="text-accent not-italic">think</em> with
              you.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              FlowNote is a calm, AI-native workspace for the way you actually
              work — capture a thought, and it's already connected to the last
              one.
            </p>

            <form
              id="waitlist"
              onSubmit={onSubmit}
              className="mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@work.com"
                aria-label="Email address"
                className="flex-1 rounded-lg border border-input bg-card px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {joined ? (
                  <>
                    <Check className="size-4" /> Joined
                  </>
                ) : (
                  <>
                    {loading ? "Joining…" : "Join waitlist"}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              No spam. One email when your invite is ready.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary shadow-2xl shadow-primary/10">
              <img
                src={heroImg}
                alt="FlowNote workspace preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-card p-4 shadow-lg md:block">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className="mt-1 font-display text-lg">3 threads clarified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-sm uppercase tracking-widest text-accent">
              What's inside
            </div>
            <h2 className="mt-3 text-4xl md:text-5xl">
              Built for the messy middle of thinking.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-8 transition hover:border-accent/40"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-2xl">{f.title}</h3>
                <p className="mt-3 text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl">Get in early.</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          We're onboarding a small group each week. Drop your email and we'll
          reach out when it's your turn.
        </p>
        <a
          href="#waitlist"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Join the waitlist <ArrowRight className="size-4" />
        </a>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} FlowNote</div>
          <div>Made with care.</div>
        </div>
      </footer>
    </div>
  );
}
