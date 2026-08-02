import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { AdminGate } from "@/components/admin-gate"

export const dynamic = "force-dynamic"

function isConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD)
}

async function checkPassword(formData: FormData) {
  "use server"
  const password = formData.get("password")
  return typeof password === "string" && password === process.env.ADMIN_PASSWORD
}

async function getSignups() {
  return db.select().from(waitlist).orderBy(desc(waitlist.createdAt))
}

export default async function AdminPage() {
  const configured = isConfigured()
  const signups = configured ? await getSignups() : []

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Waitlist signups</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {configured
          ? `${signups.length} ${signups.length === 1 ? "person has" : "people have"} joined the FlowNote waitlist.`
          : "Set an ADMIN_PASSWORD environment variable to protect and view this page."}
      </p>

      <div className="mt-8">
        <AdminGate configured={configured} checkPassword={checkPassword} signups={signups} />
      </div>
    </main>
  )
}
