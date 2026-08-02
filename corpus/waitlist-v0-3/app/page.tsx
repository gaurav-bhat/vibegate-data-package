import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { WaitlistCta } from "@/components/waitlist-cta"
import { NotebookPen } from "lucide-react"

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <WaitlistCta />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <NotebookPen className="size-3.5" aria-hidden="true" />
            </span>
            <span className="font-heading text-sm font-semibold">FlowNote</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FlowNote. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
