"use client"

import { useState, useTransition } from "react"
import { createTodo, toggleTodo, deleteTodo } from "@/app/actions/todos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"

type Todo = {
  id: number
  userId: string
  title: string
  completed: boolean
  createdAt: Date
}

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()

  const activeCount = initialTodos.filter((t) => !t.completed).length
  const completedCount = initialTodos.length - activeCount

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    setTitle("")
    startTransition(async () => {
      await createTodo(value)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          aria-label="New task"
          className="h-11"
        />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={isPending || !title.trim()}>
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Add task</span>
        </Button>
      </form>

      {initialTodos.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{activeCount} active</span>
          <span aria-hidden="true">•</span>
          <span>{completedCount} completed</span>
        </div>
      )}

      {initialTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ListTodo className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No tasks yet</p>
            <p className="text-sm text-muted-foreground">Add your first task above to get started.</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {initialTodos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={(checked) =>
                  startTransition(async () => {
                    await toggleTodo(todo.id, checked === true)
                  })
                }
                aria-label={todo.completed ? "Mark as not done" : "Mark as done"}
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={cn(
                  "flex-1 cursor-pointer text-sm text-foreground leading-relaxed",
                  todo.completed && "text-muted-foreground line-through",
                )}
              >
                {todo.title}
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() =>
                  startTransition(async () => {
                    await deleteTodo(todo.id)
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Delete task</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
