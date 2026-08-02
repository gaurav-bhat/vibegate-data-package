import { Waves } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { WaitlistCta } from "@/components/waitlist-cta"

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <WaitlistCta />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Waves className="size-3.5" aria-hidden="true" />
            </span>
            <span className="font-serif font-semibold text-foreground">FlowNote</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FlowNote. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
