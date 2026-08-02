import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, LogOut, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

const titleSchema = z.string().trim().min(1, "Task can't be empty").max(200, "Too long");

function TasksPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const tasks = useQuery({
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
    mutationFn: async (newTitle: string) => {
      const { error } = await supabase
        .from("tasks")
        .insert({ title: newTitle, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add task"),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = titleSchema.safeParse(title);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    addTask.mutate(parsed.data);
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const list = tasks.data ?? [];
  const remaining = list.filter((t) => !t.completed).length;

  return (
    <main className="min-h-screen">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Tasky</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.isLoading
              ? "Loading…"
              : list.length === 0
                ? "Nothing here yet — add your first task below."
                : `${remaining} of ${list.length} remaining`}
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task…"
            maxLength={200}
            className="h-11"
          />
          <Button type="submit" size="lg" disabled={addTask.isPending || !title.trim()}>
            {addTask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </>
            )}
          </Button>
        </form>

        <ul className="mt-6 space-y-2">
          {list.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-soft transition-colors hover:border-primary/30"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={(v) =>
                  toggleTask.mutate({ id: task.id, completed: v === true })
                }
                className="h-5 w-5"
              />
              <span
                className={cn(
                  "flex-1 text-[15px] transition-all",
                  task.completed && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask.mutate(task.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>

        {!tasks.isLoading && list.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              A calm inbox is a good starting point.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
