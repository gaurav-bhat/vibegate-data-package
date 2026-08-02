import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTodos } from "@/app/actions/todos"
import { TodoList } from "@/components/todo-list"
import { SignOutButton } from "@/components/sign-out-button"
import { CheckCircle2 } from "lucide-react"

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const todos = await getTodos()

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">Tasks</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
            {greeting()}, {session.user.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-muted-foreground text-pretty">Here&apos;s what&apos;s on your plate today.</p>
        </div>

        <TodoList initialTodos={todos} />
      </main>
    </div>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}
