import { NotebookPen } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NotebookPen className="size-4" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">FlowNote</span>
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Features
          </a>
          <a
            href="#waitlist"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Join waitlist
          </a>
        </nav>
      </div>
    </header>
  )
}
