import { useEffect, useState, type FormEvent } from 'react';
import { CheckSquare, Plus, Loader2, Trash2, Check, LogOut, ListTodo } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Todo } from '@/lib/supabase';

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

  const addTodo = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const { data, error } = await supabase
      .from('todos')
      .insert({ title })
      .select()
      .single();
    if (!error && data) {
      setTodos((prev) => [data as Todo, ...prev]);
      setNewTitle('');
    }
    setAdding(false);
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);
    if (!error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-none">My Tasks</h1>
              <p className="text-xs text-slate-500 mt-1">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={addTodo} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new task..."
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-xl transition shadow-sm"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>

        {todos.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {completedCount} of {todos.length} done
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ListTodo className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium">No tasks yet</p>
            <p className="text-slate-400 text-sm mt-1">Add your first task to get started</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-3 hover:border-slate-300 transition"
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                    todo.completed
                      ? 'bg-slate-900 border-slate-900'
                      : 'border-slate-300 hover:border-slate-900'
                  }`}
                >
                  {todo.completed && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <span
                  className={`flex-1 text-sm transition ${
                    todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
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
