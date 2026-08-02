import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Todo } from '@/lib/supabase';

export default function TaskList() {
  const { user, signOut } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setTodos(data ?? []);
    setLoading(false);
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const { data, error } = await supabase
      .from('todos')
      .insert({ title })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setTodos((prev) => [data, ...prev]);
    setNewTitle('');
    setError(null);
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase.from('todos').update({ completed }).eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = async () => {
    const completedIds = todos.filter((t) => t.completed).map((t) => t.id);
    if (completedIds.length === 0) return;
    const { error } = await supabase.from('todos').delete().in('id', completedIds);
    if (error) {
      setError(error.message);
      return;
    }
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const filtered = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
  );
  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg">Tasked</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Your tasks</h1>
        <p className="text-slate-500 mb-6">Stay organized and get things done.</p>

        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new task…"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition flex items-center gap-1.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        </form>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                  filter === f
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {todos.some((t) => t.completed) && (
            <button
              onClick={clearCompleted}
              className="text-sm text-slate-500 hover:text-slate-900 transition"
            >
              Clear completed
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading your tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <p className="text-slate-500">
              {filter === 'all' ? 'No tasks yet. Add one above to get started.' : `No ${filter} tasks.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((todo) => (
              <li
                key={todo.id}
                className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:shadow-sm transition"
              >
                <button
                  onClick={() => toggleTodo(todo.id, !todo.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    todo.completed
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-300 hover:border-slate-900'
                  }`}
                  aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
                >
                  {todo.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 text-slate-800 transition ${
                    todo.completed ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1"
                  aria-label="Delete task"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && todos.length > 0 && (
          <p className="text-sm text-slate-400 mt-6 text-center">
            {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining
          </p>
        )}
      </main>
    </div>
  );
}
