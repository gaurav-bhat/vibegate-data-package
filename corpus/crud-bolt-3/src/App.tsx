import { useCallback, useEffect, useState } from 'react';
import { Plus, Package, Search, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductInput } from '@/types/product';
import ProductTable from '@/components/ProductTable';
import ProductFormModal from '@/components/ProductFormModal';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError('Could not load products. Please try again.');
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSave = async (input: ProductInput, id?: string) => {
    if (id) {
      const { error } = await supabase
        .from('products')
        .update({ name: input.name, price: input.price, description: input.description })
        .eq('id', id);
      if (error) throw new Error('Could not update the product.');
    } else {
      const { error } = await supabase.from('products').insert(input);
      if (error) throw new Error('Could not add the product.');
    }
    await loadProducts();
  };

  const handleDelete = async (product: Product) => {
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) throw new Error('Could not delete the product.');
    await loadProducts();
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  });

  const totalValue = products.reduce((sum, p) => sum + Number(p.price), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Product Admin</h1>
              <p className="text-xs text-slate-400">Manage your product catalog</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus size={18} />
            Add product
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total products" value={String(products.length)} />
          <StatCard
            label="Catalog value"
            value={new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(totalValue)}
          />
          <StatCard
            label="Average price"
            value={
              products.length
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totalValue / products.length)
                : '$0.00'
            }
          />
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or description"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <AlertCircle className="text-red-500" size={32} />
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={loadProducts}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Package size={26} />
            </div>
            <div>
              <p className="font-medium text-slate-700">
                {query ? 'No matching products' : 'No products yet'}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {query
                  ? 'Try a different search term.'
                  : 'Add your first product to get started.'}
              </p>
            </div>
            {!query && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Add product
              </button>
            )}
          </div>
        ) : (
          <ProductTable
            products={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      <ProductFormModal
        open={modalOpen}
        product={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
