import Link from "next/link"
import { Feather } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Feather className="size-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">FlowNote</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#waitlist" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Waitlist
          </a>
        </nav>
        <Button render={<a href="#waitlist" />} nativeButton={false} size="sm">
          Get early access
        </Button>
      </div>
    </header>
  )
}
