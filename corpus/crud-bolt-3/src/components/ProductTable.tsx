import { useState } from 'react';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Product } from '@/types/product';

type Props = {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => Promise<void>;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export default function ProductTable({ products, onEdit, onDelete }: Props) {
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="group transition hover:bg-blue-50/40"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">
                      {formatPrice(product.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <span className="text-sm text-slate-500 line-clamp-2">
                      {product.description || (
                        <span className="text-slate-300">No description</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-100 hover:text-blue-600"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setPendingDelete(product)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !deleting && setPendingDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete product
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-slate-700">
                    {pendingDelete.name}
                  </span>
                  ? This action can't be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
