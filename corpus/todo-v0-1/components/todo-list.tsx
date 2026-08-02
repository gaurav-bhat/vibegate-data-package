'use client'

import { useState, useTransition, useRef } from 'react'
import { createTodo, toggleTodo, deleteTodo } from '@/app/actions/todos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'

type Todo = {
  id: number
  userId: string
  title: string
  completed: boolean
  createdAt: Date
}

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const remaining = initialTodos.filter((t) => !t.completed).length

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    setTitle('')
    inputRef.current?.focus()
    startTransition(async () => {
      await createTodo(value)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          aria-label="New task"
          className="h-11"
        />
        <Button
          type="submit"
          disabled={isPending || !title.trim()}
          className="h-11 shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </form>

      {initialTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <ListTodo
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-foreground">No tasks yet</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add your first task above to get started.
            </p>
          </div>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {initialTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
          <p className="text-sm text-muted-foreground text-center">
            {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining
          </p>
        </>
      )}
    </div>
  )
}

function TodoItem({ todo }: { todo: Todo }) {
  const [isPending, startTransition] = useTransition()

  return (
    <li
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors',
        isPending && 'opacity-60',
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            await toggleTodo(todo.id, checked === true)
          })
        }
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      <span
        className={cn(
          'flex-1 text-sm text-foreground break-words',
          todo.completed && 'text-muted-foreground line-through',
        )}
      >
        {todo.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          startTransition(async () => {
            await deleteTodo(todo.id)
          })
        }
        className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Delete "${todo.title}"`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </li>
  )
}
