import Image from "next/image"
import { Sparkles } from "lucide-react"
import { WaitlistForm } from "@/components/waitlist-form"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 md:px-6 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Now in private beta
          </span>
          <h1 className="mt-6 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
            Notes that think with you
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            FlowNote is the AI-native notebook that captures your ideas, connects them automatically, and turns scattered
            thoughts into clear next steps.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <WaitlistForm />
            <p className="text-xs text-muted-foreground">Free during beta. No credit card required.</p>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-4xl md:mt-20">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/10">
            <Image
              src="/flownote-app.png"
              alt="FlowNote app interface showing notes with automatically linked related ideas"
              width={1200}
              height={750}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
