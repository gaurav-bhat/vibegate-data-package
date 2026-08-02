"use server"

import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export type JoinWaitlistState = {
  status: "idle" | "success" | "error"
  message: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function joinWaitlist(
  _prevState: JoinWaitlistState,
  formData: FormData,
): Promise<JoinWaitlistState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()

  if (!email || !EMAIL_REGEX.test(email)) {
    return { status: "error", message: "Please enter a valid email address." }
  }

  try {
    const inserted = await db
      .insert(waitlist)
      .values({ email })
      .onConflictDoNothing({ target: waitlist.email })
      .returning({ id: waitlist.id })

    if (inserted.length === 0) {
      return { status: "success", message: "You're already on the list. We'll be in touch!" }
    }

    return { status: "success", message: "You're on the list! We'll email you when FlowNote launches." }
  } catch (error) {
    console.log("[v0] joinWaitlist error:", error instanceof Error ? error.message : error)
    return { status: "error", message: "Something went wrong. Please try again." }
  }
}

export async function getSignups() {
  return db.select().from(waitlist).orderBy(desc(waitlist.createdAt))
}
