"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { joinWaitlist, type WaitlistResult } from "@/app/actions/waitlist"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

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

export function WaitlistForm() {
  const [state, formAction] = useActionState<WaitlistResult | null, FormData>(joinWaitlist, null)

  if (state?.success) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent px-5 py-4 text-accent-foreground">
        <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-pretty">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
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
            className="h-11 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <SubmitButton />
      </div>
      {state && !state.success && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
    </form>
  )
}
