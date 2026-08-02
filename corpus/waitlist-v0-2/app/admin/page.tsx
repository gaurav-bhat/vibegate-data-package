import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { getSignups } from "@/app/actions/waitlist"

export const dynamic = "force-dynamic"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

export default async function AdminPage() {
  const signups = await getSignups()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight text-foreground">Waitlist signups</h1>
            <p className="mt-2 text-muted-foreground">
              {signups.length} {signups.length === 1 ? "person has" : "people have"} joined the FlowNote waitlist.
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          {signups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-muted-foreground">No signups yet. Share your landing page to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-6 py-3 font-medium">Email</th>
                  <th scope="col" className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((signup) => (
                  <tr key={signup.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-4 font-medium text-foreground">{signup.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(signup.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
