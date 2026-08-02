'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { todos } from '@/lib/db/schema'
import { and, asc, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * Resolve the current user id from the Better Auth session.
 * Every action that touches todos MUST go through this helper — it is the only
 * thing standing between one user and another user's rows.
 */
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getTodos() {
  const userId = await getUserId()
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(asc(todos.completed), desc(todos.createdAt))
}

export async function createTodo(title: string) {
  const userId = await getUserId()
  const trimmed = title.trim()
  if (!trimmed) return
  await db.insert(todos).values({ userId, title: trimmed })
  revalidatePath('/')
}

export async function toggleTodo(id: number, completed: boolean) {
  const userId = await getUserId()
  await db
    .update(todos)
    .set({ completed })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
  revalidatePath('/')
}

export async function deleteTodo(id: number) {
  const userId = await getUserId()
  await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, userId)))
  revalidatePath('/')
}
