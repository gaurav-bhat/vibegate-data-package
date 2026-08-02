import { Waves } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Waves className="size-5" aria-hidden="true" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">FlowNote</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Primary">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#waitlist" className="transition-colors hover:text-foreground">
            Waitlist
          </a>
        </nav>
        <Button size="sm" nativeButton={false} render={<a href="#waitlist">Get early access</a>} />
      </div>
    </header>
  )
}
