import { Link2, Sparkles, Search, ListChecks, Lock, Zap } from "lucide-react"

const features = [
  {
    icon: Link2,
    title: "Automatic connections",
    description: "FlowNote links related notes as you write, building a living map of your ideas without manual tagging.",
  },
  {
    icon: Sparkles,
    title: "AI that drafts with you",
    description: "Summarize, expand, or rewrite any note in a click. Your assistant understands the context of your work.",
  },
  {
    icon: ListChecks,
    title: "Ideas into action",
    description: "Turn messy meeting notes into clear tasks and next steps automatically, so nothing slips through.",
  },
  {
    icon: Search,
    title: "Search that understands",
    description: "Ask questions in plain language and get answers pulled from across every note you've ever written.",
  },
  {
    icon: Zap,
    title: "Built for speed",
    description: "Instant capture, keyboard-first navigation, and zero lag—so your tool keeps pace with your thinking.",
  },
  {
    icon: Lock,
    title: "Private by default",
    description: "Your notes are encrypted and yours alone. We never train public models on your personal data.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Everything you capture, working together
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            FlowNote does the busywork of organizing so you can stay in your flow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                <feature.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
