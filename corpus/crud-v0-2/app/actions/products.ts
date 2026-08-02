"use server"

import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt))
}

type ProductInput = {
  name: string
  price: string
  description: string
}

function normalize(input: ProductInput) {
  const name = input.name.trim()
  const description = input.description.trim()
  const priceNumber = Number.parseFloat(input.price)
  const price = Number.isFinite(priceNumber) && priceNumber >= 0 ? priceNumber.toFixed(2) : "0.00"
  return { name, description, price }
}

export async function createProduct(input: ProductInput) {
  const data = normalize(input)
  if (!data.name) throw new Error("Name is required")
  await db.insert(products).values(data)
  revalidatePath("/")
}

export async function updateProduct(id: number, input: ProductInput) {
  const data = normalize(input)
  if (!data.name) throw new Error("Name is required")
  await db.update(products).set(data).where(eq(products.id, id))
  revalidatePath("/")
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/")
}
