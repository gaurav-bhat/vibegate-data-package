"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { login } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Loader2, Lock } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? "Checking" : "View signups"}
    </Button>
  )
}

export function AdminLogin() {
  const [state, formAction] = useActionState<{ error: string } | null, FormData>(login, null)

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
          <Lock className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-center font-heading text-xl font-bold">Waitlist admin</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Enter your password to view signups.</p>
        <div className="mt-6 space-y-3">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Password"
            className="h-11 w-full rounded-lg border border-input bg-background px-4 text-base outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <SubmitButton />
        </div>
        {state?.error && (
          <p className="mt-3 text-center text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  )
}
