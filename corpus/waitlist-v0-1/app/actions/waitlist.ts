"use server"

import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type JoinState = {
  status: "idle" | "success" | "error"
  message: string
}

export async function joinWaitlist(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const raw = formData.get("email")
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : ""

  if (!email || !EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email address." }
  }

  try {
    const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1)
    if (existing.length > 0) {
      return { status: "success", message: "You're already on the list. We'll be in touch!" }
    }

    await db.insert(waitlist).values({ email })
    return { status: "success", message: "You're on the list! We'll email you when FlowNote launches." }
  } catch (error) {
    console.log("[v0] joinWaitlist error:", error)
    return { status: "error", message: "Something went wrong. Please try again." }
  }
}
