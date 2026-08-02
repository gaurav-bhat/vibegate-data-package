"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock, AlertCircle } from "lucide-react"

type Signup = {
  id: number
  email: string
  createdAt: Date | string
}

export function AdminGate({
  configured,
  checkPassword,
  signups,
}: {
  configured: boolean
  checkPassword: (formData: FormData) => Promise<boolean>
  signups: Signup[]
}) {
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const [pending, setPending] = useState(false)

  if (!configured) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Add an <code className="rounded bg-muted px-1 py-0.5 text-foreground">ADMIN_PASSWORD</code> in your project&apos;s
        environment variables, then reload this page to sign in and view signups.
      </div>
    )
  }

  if (!unlocked) {
    async function action(formData: FormData) {
      setPending(true)
      setError(false)
      const ok = await checkPassword(formData)
      setPending(false)
      if (ok) setUnlocked(true)
      else setError(true)
    }

    return (
      <form action={action} className="max-w-sm rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-foreground">
          <Lock className="size-4" aria-hidden="true" />
          <span className="font-medium">Enter password</span>
        </div>
        <label htmlFor="password" className="sr-only">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className="mt-4 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            Incorrect password.
          </p>
        )}
        <Button type="submit" disabled={pending} className="mt-4 w-full">
          {pending ? "Checking..." : "Unlock"}
        </Button>
      </form>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {signups.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                No signups yet.
              </td>
            </tr>
          ) : (
            signups.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
