import { isAdminAuthenticated, logout } from "@/app/actions/admin"
import { getWaitlistEntries } from "@/app/actions/waitlist"
import { AdminLogin } from "@/components/admin-login"
import { Button } from "@/components/ui/button"
import { LogOut, Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()

  if (!authed) {
    return <AdminLogin />
  }

  const entries = await getWaitlistEntries()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Waitlist signups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "person has" : "people have"} joined so far.
          </p>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm" className="gap-2" type="submit">
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </form>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">No signups yet. Share your landing page to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <span className="truncate font-medium">{entry.email}</span>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="shrink-0 text-sm text-muted-foreground"
                >
                  {entry.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
