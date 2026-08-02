"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { joinWaitlist, type JoinState } from "@/app/actions/waitlist"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

const initialState: JoinState = { status: "idle", message: "" }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="shrink-0">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Joining...
        </>
      ) : (
        "Join the waitlist"
      )}
    </Button>
  )
}

export function WaitlistForm({ id }: { id?: string }) {
  const [state, formAction] = useActionState(joinWaitlist, initialState)

  return (
    <div id={id} className="w-full max-w-md">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="h-11 flex-1 rounded-md border border-input bg-card px-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <SubmitButton />
      </form>

      {state.status !== "idle" && (
        <p
          role="status"
          className={`mt-3 flex items-center gap-2 text-sm ${
            state.status === "success" ? "text-primary" : "text-destructive"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          )}
          {state.message}
        </p>
      )}
    </div>
  )
}
