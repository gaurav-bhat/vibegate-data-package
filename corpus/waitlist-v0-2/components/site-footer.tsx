import { Feather } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Feather className="size-3.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-foreground">FlowNote</span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} FlowNote. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
