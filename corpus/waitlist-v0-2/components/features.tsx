import { Zap, Link2, Search, Lock, Layers, RefreshCw } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Capture at the speed of thought",
    description:
      "A frictionless editor and global quick-capture mean an idea never slips away. Start typing and you're already organized.",
  },
  {
    icon: Link2,
    title: "Connected by default",
    description:
      "Link notes together and FlowNote surfaces the connections automatically, turning scattered notes into a knowledge base.",
  },
  {
    icon: Search,
    title: "Instant, fuzzy search",
    description:
      "Find anything in milliseconds. Search across every note, tag, and attachment — even when you can't remember the exact words.",
  },
  {
    icon: Layers,
    title: "Organize without the busywork",
    description:
      "Folders, tags, and smart views adapt to how you work. No rigid hierarchy to fight against.",
  },
  {
    icon: RefreshCw,
    title: "Sync everywhere",
    description:
      "Your notes stay in sync across desktop, web, and mobile in real time, online or offline.",
  },
  {
    icon: Lock,
    title: "Private and secure",
    description:
      "End-to-end encryption keeps your thoughts yours. Your data is never sold or used to train models.",
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Everything you need</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight text-balance text-foreground sm:text-5xl">
            A workspace designed to stay out of your way
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            FlowNote brings together the tools you actually use, without the bloat that slows you down.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-foreground/5"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <feature.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
