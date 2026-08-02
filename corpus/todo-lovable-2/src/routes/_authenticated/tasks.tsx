import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, LogOut, Trash2, Plus } from "lucide-react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Your tasks · Tally" },
      { name: "description", content: "Add, complete, and clear tasks from your personal to-do list." },
      { property: "og:title", content: "Your tasks · Tally" },
      { property: "og:description", content: "Add, complete, and clear tasks from your personal to-do list." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTasks(data ?? []);
    setLoading(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: trimmed, user_id: userData.user.id })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setTasks((t) => [data as Task, ...t]);
    setTitle("");
  };

  const toggle = async (task: Task) => {
    const next = !task.completed;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: next } : t)));
    const { error } = await supabase.from("tasks").update({ completed: next }).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  };

  const remove = async (task: Task) => {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      toast.error(error.message);
      setTasks(prev);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Tally</span>
          </div>
          <div className="flex items-center gap-3">
            {email && <span className="text-sm text-muted-foreground hidden sm:inline">{email}</span>}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {remaining === 0 ? "All done. Nice." : `${remaining} task${remaining === 1 ? "" : "s"} left.`}
        </p>

        <form onSubmit={add} className="mt-6 flex gap-2">
          <Input
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11"
          />
          <Button type="submit" className="h-11" disabled={!title.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <ul className="mt-6 space-y-1">
          {loading ? (
            <li className="text-sm text-muted-foreground py-8 text-center">Loading…</li>
          ) : tasks.length === 0 ? (
            <li className="text-sm text-muted-foreground py-16 text-center border border-dashed rounded-xl">
              No tasks yet. Add your first one above.
            </li>
          ) : (
            tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 transition"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggle(task)}
                  className="h-5 w-5"
                />
                <span
                  className={
                    "flex-1 text-sm " +
                    (task.completed ? "line-through text-muted-foreground" : "text-foreground")
                  }
                >
                  {task.title}
                </span>
                <button
                  onClick={() => remove(task)}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}
