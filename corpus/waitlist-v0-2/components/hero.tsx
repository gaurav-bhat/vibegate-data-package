import Image from "next/image"
import { Sparkles } from "lucide-react"
import { WaitlistForm } from "@/components/waitlist-form"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Now in private beta
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
            Notes that keep up with your thinking
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            FlowNote is the calm, focused workspace for capturing ideas, connecting them, and
            staying in flow — without the clutter of every other notes app.
          </p>
          <div id="waitlist" className="mx-auto mt-8 max-w-md scroll-mt-24">
            <WaitlistForm />
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10">
            <Image
              src="/flownote-app.png"
              alt="The FlowNote app showing a note editor with folders, a document, and linked notes"
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
