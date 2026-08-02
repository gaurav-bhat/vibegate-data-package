import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTodos } from '@/app/actions/todos'
import { TodoList } from '@/components/todo-list'
import { SignOutButton } from '@/components/sign-out-button'
import { CheckCircle2 } from 'lucide-react'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const todos = await getTodos()
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            <span className="font-semibold tracking-tight text-foreground">
              Tasks
            </span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            Hi {firstName}, here&apos;s your list
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Add tasks, check them off, and clear out what&apos;s done.
          </p>
        </div>

        <TodoList initialTodos={todos} />
      </main>
    </div>
  )
}
