"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { joinWaitlist, type JoinWaitlistState } from "@/app/actions/waitlist"
import { Button } from "@/components/ui/button"

const initialState: JoinWaitlistState = { status: "idle", message: "" }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="shrink-0 gap-2">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Joining
        </>
      ) : (
        <>
          Join waitlist
          <ArrowRight className="size-4" aria-hidden="true" />
        </>
      )}
    </Button>
  )
}

export function WaitlistForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(joinWaitlist, initialState)

  if (state.status === "success") {
    return (
      <div
        className={className}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-4 text-accent-foreground">
          <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-pretty">{state.message}</p>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className={className} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={state.status === "error"}
          className="h-11 w-full flex-1 rounded-xl border border-input bg-card px-4 text-base text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <SubmitButton />
      </div>
      {state.status === "error" && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        Join the waitlist for early access. No spam, unsubscribe anytime.
      </p>
    </form>
  )
}
