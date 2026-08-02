"use server"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ProductInput = {
  name: string
  price: string
  description: string
}

function validate(input: ProductInput) {
  const name = input.name?.trim()
  const description = input.description?.trim() ?? ""
  const priceNumber = Number(input.price)

  if (!name) {
    return { error: "Name is required." }
  }
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return { error: "Price must be a valid non-negative number." }
  }

  return {
    data: {
      name,
      description,
      price: priceNumber.toFixed(2),
    },
  }
}

export async function getProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt))
}

export async function createProduct(input: ProductInput) {
  const result = validate(input)
  if (result.error) return { error: result.error }

  await db.insert(products).values(result.data!)
  revalidatePath("/")
  return { success: true }
}

export async function updateProduct(id: number, input: ProductInput) {
  const result = validate(input)
  if (result.error) return { error: result.error }

  await db.update(products).set(result.data!).where(eq(products.id, id))
  revalidatePath("/")
  return { success: true }
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/")
  return { success: true }
}
