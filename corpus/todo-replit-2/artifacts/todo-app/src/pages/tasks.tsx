import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser, useClerk } from '@clerk/react';
import { 
  useListTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask,
  useGetTaskStats,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Plus, Trash2, LogOut, Circle } from 'lucide-react';
import type { Task } from '@workspace/api-client-react';

export default function TasksPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useListTasks();
  const { data: stats, isLoading: statsLoading } = useGetTaskStats();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTask.mutate(
      { data: { title: newTaskTitle.trim() } },
      {
        onSuccess: () => {
          setNewTaskTitle('');
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
          inputRef.current?.focus();
        },
        onError: () => {
          toast({
            title: 'Failed to create task',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleToggleTask = (task: Task) => {
    updateTask.mutate(
      { id: task.id, data: { completed: !task.completed } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        },
        onError: () => {
          toast({
            title: 'Failed to update task',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDeleteTask = (id: number) => {
    deleteTask.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
          toast({
            title: 'Task deleted',
            description: 'The task has been removed.',
          });
        },
        onError: () => {
          toast({
            title: 'Failed to delete task',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || '/' });
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-16">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Taskly</h1>
              {user && (
                <p className="text-sm text-muted-foreground" data-testid="text-user-name">
                  {user.firstName || user.emailAddresses[0]?.emailAddress}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} data-testid="button-sign-out">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </header>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-card border border-card-border p-4 text-center" data-testid="card-stat-total">
                <div className="text-2xl font-bold text-foreground">{stats?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="rounded-2xl bg-card border border-card-border p-4 text-center" data-testid="card-stat-completed">
                <div className="text-2xl font-bold text-primary">{stats?.completed || 0}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="rounded-2xl bg-card border border-card-border p-4 text-center" data-testid="card-stat-pending">
                <div className="text-2xl font-bold text-accent-foreground">{stats?.pending || 0}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </>
          )}
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleCreateTask} className="mb-8">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 h-14 text-base rounded-2xl bg-card border-card-border"
              disabled={createTask.isPending}
              data-testid="input-new-task"
            />
            <Button
              type="submit"
              size="lg"
              disabled={!newTaskTitle.trim() || createTask.isPending}
              className="h-14 px-6 rounded-2xl"
              data-testid="button-add-task"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add
            </Button>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-3">
          {tasksLoading ? (
            <>
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center" data-testid="empty-state">
              <Circle className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No tasks yet</p>
              <p className="text-muted-foreground">Add your first task to get started</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`task-item flex items-center gap-4 rounded-2xl bg-card border border-card-border p-4 shadow-sm ${
                  task.completed ? 'opacity-60' : ''
                }`}
                data-testid={`task-item-${task.id}`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask(task)}
                  disabled={updateTask.isPending}
                  className="h-5 w-5"
                  data-testid={`checkbox-task-${task.id}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-base ${
                      task.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                    data-testid={`text-task-title-${task.id}`}
                  >
                    {task.title}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  disabled={deleteTask.isPending}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                  data-testid={`button-delete-${task.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
