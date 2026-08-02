import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Sparkles, Zap, Brain, Lock, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import heroBg from "@/assets/flownote-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowNote — Notes that think with you" },
      {
        name: "description",
        content:
          "FlowNote is the AI-native notes app that captures ideas, connects them, and turns them into action. Join the waitlist.",
      },
      { property: "og:title", content: "FlowNote — Notes that think with you" },
      {
        property: "og:description",
        content:
          "AI-native notes that capture, connect, and turn your ideas into action. Join the FlowNote waitlist.",
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
  .min(1, "Email is required")
  .email("Enter a valid email")
  .max(255);

function Landing() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: parsed.data.toLowerCase() });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        setJoined(true);
        toast.success("You're already on the list!");
        return;
      }
      toast.error("Something went wrong. Try again.");
      return;
    }
    setJoined(true);
    toast.success("You're in! We'll be in touch.");
    setEmail("");
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <Toaster theme="dark" position="top-center" />

      {/* Background */}
      <div
        className="absolute inset-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]"
        aria-hidden
      />

      <div className="relative">
        {/* Nav */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FlowNote</span>
          </div>
          <a
            href="#waitlist"
            className="text-sm text-white/70 hover:text-white transition"
          >
            Join waitlist →
          </a>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center sm:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Now in private beta
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            Notes that{" "}
            <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-teal-200 bg-clip-text text-transparent">
              think with you
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
            FlowNote captures your ideas, connects the dots automatically, and
            turns scattered thoughts into clear next steps.
          </p>

          {/* Waitlist form */}
          <form
            id="waitlist"
            onSubmit={onSubmit}
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              required
              placeholder="you@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || joined}
              className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-violet-400"
            />
            <Button
              type="submit"
              disabled={loading || joined}
              className="h-12 bg-gradient-to-r from-violet-500 to-indigo-500 px-6 font-medium text-white hover:opacity-90"
            >
              {joined ? (
                <>
                  <Check className="mr-1 h-4 w-4" /> Joined
                </>
              ) : loading ? (
                "Joining…"
              ) : (
                <>
                  Join waitlist <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <p className="mt-3 text-xs text-white/40">
            No spam. Early access invitations only.
          </p>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-32">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for the way you actually think
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/60">
              Three ideas that make FlowNote feel less like an app and more
              like a second brain.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Feature
              icon={<Brain className="h-5 w-5" />}
              title="AI that reads between the lines"
              body="Auto-summaries, smart tags, and suggested connections surface what matters — without prompting."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Capture at the speed of thought"
              body="A command bar, quick capture, and offline sync mean your ideas land before they fade."
            />
            <Feature
              icon={<Lock className="h-5 w-5" />}
              title="Private by default"
              body="End-to-end encrypted vaults. Your notes are yours — never training data."
            />
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} FlowNote. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-200 ring-1 ring-white/10">
        {icon}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-white/60">{body}</p>
    </div>
  );
}
