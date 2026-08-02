import Image from "next/image"
import { WaitlistForm } from "@/components/waitlist-form"
import { Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Now in private beta
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-balance md:text-6xl">
            Capture ideas at the speed of thought
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            FlowNote is the effortless note-taking app that keeps your thoughts organized, connected, and always in
            flow. No clutter, no friction—just you and your ideas.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <WaitlistForm />
            <p className="mt-3 text-sm text-muted-foreground">
              Join the waitlist for early access. No spam, unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5">
            <Image
              src="/flownote-app-preview.png"
              alt="FlowNote app interface showing organized notes and a clean editor"
              width={1600}
              height={1000}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
