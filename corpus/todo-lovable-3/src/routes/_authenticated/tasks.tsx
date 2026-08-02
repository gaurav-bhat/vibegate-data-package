import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, LogOut, Plus, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Your tasks · Tally" },
      { name: "description", content: "Your personal task list." },
    ],
  }),
  component: TasksPage,
});

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

function TasksPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,completed,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addTask = useMutation({
    mutationFn: async (t: string) => {
      const { error } = await supabase.from("tasks").insert({ title: t, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask.mutate(trimmed);
  }

  const tasks = tasksQuery.data ?? [];
  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            Tally
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>

        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight">Your tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length === 0
              ? "Nothing here yet. Add your first task below."
              : `${remaining} of ${tasks.length} remaining`}
          </p>

          <form onSubmit={onAdd} className="mt-6 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 rounded-lg border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button
              type="submit"
              disabled={addTask.isPending || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {addTask.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </button>
          </form>

          <ul className="mt-6 space-y-2">
            {tasksQuery.isLoading && (
              <li className="flex items-center justify-center rounded-lg border border-border bg-card py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </li>
            )}
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-foreground/15"
              >
                <button
                  onClick={() =>
                    toggleTask.mutate({ id: task.id, completed: !task.completed })
                  }
                  aria-label={task.completed ? "Mark as not done" : "Mark as done"}
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                    task.completed
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  {task.completed && <CheckCircle2 className="h-4 w-4" />}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    task.completed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => deleteTask.mutate(task.id)}
                  aria-label="Delete task"
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
