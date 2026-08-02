"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE_NAME = "flownote_admin"

export async function isAdminAuthenticated() {
  const password = process.env.WAITLIST_ADMIN_PASSWORD
  if (!password) return false
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value === password
}

export async function login(_prevState: { error: string } | null, formData: FormData) {
  const password = process.env.WAITLIST_ADMIN_PASSWORD
  if (!password) {
    return { error: "Admin password is not configured. Set WAITLIST_ADMIN_PASSWORD." }
  }

  const entered = formData.get("password")
  if (typeof entered !== "string" || entered !== password) {
    return { error: "Incorrect password." }
  }

  const store = await cookies()
  store.set(COOKIE_NAME, password, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect("/admin")
}

export async function logout() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
  redirect("/admin")
}
