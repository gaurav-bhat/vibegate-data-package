import { useClerk } from "@clerk/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTaskInput } from "@/components/AddTaskInput";
import { TaskItem } from "@/components/TaskItem";
import { TaskSummary } from "@/components/TaskSummary";
import {
  useGetTasks,
  useGetTasksSummary,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  getGetTasksQueryKey,
  getGetTasksSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function TasksPage() {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useGetTasks({
    query: { queryKey: getGetTasksQueryKey() },
  });

  const { data: summary } = useGetTasksSummary({
    query: { queryKey: getGetTasksSummaryQueryKey() },
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTasksSummaryQueryKey() });
      },
    },
  });

  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTasksSummaryQueryKey() });
      },
    },
  });

  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTasksSummaryQueryKey() });
      },
    },
  });

  const handleAddTask = (title: string) => {
    createTask.mutate({ data: { title } });
  };

  const handleToggleTask = (id: number, done: boolean) => {
    updateTask.mutate({ id, data: { done } });
  };

  const handleDeleteTask = (id: number) => {
    deleteTask.mutate({ id });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${basePath}/logo.svg`} alt="Taskly" className="w-10 h-10" />
            <span className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Taskly
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="gap-2"
            data-testid="button-sign-out"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-10">
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
            data-testid="text-page-title"
          >
            Your tasks
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay focused on what matters today.
          </p>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-8">
            <TaskSummary summary={summary} />
          </div>
        )}

        {/* Add Task Input */}
        <div className="mb-8">
          <AddTaskInput
            onAdd={handleAddTask}
            disabled={createTask.isPending}
          />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasksLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-lg text-muted-foreground" data-testid="text-empty-state">
                No tasks yet. Add one above to get started.
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                index={index}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
