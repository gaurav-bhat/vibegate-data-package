"use server"

import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export type WaitlistResult = {
  success: boolean
  message: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function joinWaitlist(_prevState: WaitlistResult | null, formData: FormData): Promise<WaitlistResult> {
  const raw = formData.get("email")
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : ""

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, message: "Please enter a valid email address." }
  }

  try {
    await db
      .insert(waitlist)
      .values({ email })
      .onConflictDoNothing({ target: waitlist.email })

    return { success: true, message: "You're on the list! We'll be in touch soon." }
  } catch (error) {
    console.log("[v0] joinWaitlist error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}

export async function getWaitlistEntries() {
  return db
    .select()
    .from(waitlist)
    .orderBy(sql`${waitlist.createdAt} DESC`)
}
