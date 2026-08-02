import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Todo } from '@/lib/supabase';
import { Check, ListTodo, Loader2, Plus, Trash2, LogOut } from 'lucide-react';

export default function TodoApp() {
  const { user, signOut } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTodos(data as Todo[]);
    setLoading(false);
  };

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const { data, error } = await supabase
      .from('todos')
      .insert({ title })
      .select()
      .single();
    if (!error && data) setTodos((prev) => [data as Todo, ...prev]);
    setNewTitle('');
    setAdding(false);
  };

  const toggleTodo = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id);
    if (!error) {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Tasked</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline truncate max-w-[200px]">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {todos.length === 0
              ? 'Add your first task below.'
              : `${completedCount} of ${todos.length} completed`}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTodo();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500">No tasks yet. Time to get productive.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="group flex items-center gap-3 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3 hover:ring-slate-300 transition"
              >
                <button
                  onClick={() => toggleTodo(todo)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    todo.completed
                      ? 'bg-slate-900 border-slate-900'
                      : 'border-slate-300 hover:border-slate-900'
                  }`}
                >
                  {todo.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
                <span
                  className={`flex-1 text-[15px] transition ${
                    todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-400 hover:text-red-500 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
