"use server"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ActionResult = { error?: string }

function parseInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const priceRaw = String(formData.get("price") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!name) return { error: "Name is required." as const }

  const price = Number(priceRaw)
  if (priceRaw === "" || Number.isNaN(price) || price < 0) {
    return { error: "Price must be a valid non-negative number." as const }
  }

  return { data: { name, price: price.toFixed(2), description } }
}

export async function getProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt))
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const parsed = parseInput(formData)
  if (parsed.error) return { error: parsed.error }

  await db.insert(products).values(parsed.data)
  revalidatePath("/")
  return {}
}

export async function updateProduct(id: number, formData: FormData): Promise<ActionResult> {
  const parsed = parseInput(formData)
  if (parsed.error) return { error: parsed.error }

  await db.update(products).set(parsed.data).where(eq(products.id, id))
  revalidatePath("/")
  return {}
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/")
  return {}
}
