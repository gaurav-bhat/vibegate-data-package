import { Zap, Search, Link2, Lock, Layers, RefreshCw } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant capture",
    description: "Jot down thoughts in a keystroke. FlowNote opens fast and saves automatically as you type.",
  },
  {
    icon: Link2,
    title: "Connected notes",
    description: "Link ideas together with backlinks and build a personal knowledge graph that grows with you.",
  },
  {
    icon: Search,
    title: "Search that works",
    description: "Find anything in milliseconds with full-text search across every note, tag, and attachment.",
  },
  {
    icon: Layers,
    title: "Smart organization",
    description: "Nested folders, tags, and pinned notes keep even the biggest collections tidy and navigable.",
  },
  {
    icon: RefreshCw,
    title: "Sync everywhere",
    description: "Your notes stay in sync across desktop, web, and mobile—pick up right where you left off.",
  },
  {
    icon: Lock,
    title: "Private by default",
    description: "End-to-end encryption keeps your notes yours. We can't read them, and neither can anyone else.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Everything you need to stay in flow
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            FlowNote combines the speed of a scratchpad with the power of a second brain.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <feature.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
