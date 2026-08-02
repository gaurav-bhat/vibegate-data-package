import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { getTodos } from '@/app/actions/todos'
import { TodoList, type Todo } from '@/components/todo-list'
import { SignOutButton } from '@/components/sign-out-button'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const todos = (await getTodos()) as Todo[]

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">
              Tasks
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            Good to see you, {session.user.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Keep track of what needs to get done today.
          </p>
        </div>
        <TodoList initialTodos={todos} />
      </main>
    </div>
  )
}
