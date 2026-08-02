import { useState, useMemo } from 'react';
import { useListProducts, useGetProductStats } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductFormDialog } from '@/components/product-form-dialog';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { StatsCard } from '@/components/stats-card';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: products, isLoading: productsLoading, error: productsError } = useListProducts();
  const { data: stats, isLoading: statsLoading } = useGetProductStats();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <>
              <Skeleton className="h-[100px]" />
              <Skeleton className="h-[100px]" />
              <Skeleton className="h-[100px]" />
              <Skeleton className="h-[100px]" />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Products"
                value={stats?.total ?? 0}
                testId="stat-total-products"
              />
              <StatsCard
                title="Average Price"
                value={stats?.averagePrice ? formatPrice(stats.averagePrice) : '$0.00'}
                testId="stat-average-price"
              />
              <StatsCard
                title="Lowest Price"
                value={stats?.minPrice ? formatPrice(stats.minPrice) : '$0.00'}
                testId="stat-min-price"
              />
              <StatsCard
                title="Highest Price"
                value={stats?.maxPrice ? formatPrice(stats.maxPrice) : '$0.00'}
                testId="stat-max-price"
              />
            </>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-products"
            />
          </div>
          <Button onClick={handleAdd} className="gap-2" data-testid="button-add-product">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <div className="border rounded-lg bg-card">
          {productsLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : productsError ? (
            <div className="p-8 text-center" data-testid="error-loading-products">
              <p className="text-destructive font-medium">Failed to load products</p>
              <p className="text-sm text-muted-foreground mt-1">
                {productsError.message || 'An error occurred while loading the product catalog.'}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center" data-testid="empty-products">
              <p className="text-muted-foreground">
                {searchQuery ? 'No products match your search.' : 'No products yet. Add your first product to get started.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead className="w-[15%]">Price</TableHead>
                  <TableHead className="w-[35%]">Description</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-medium" data-testid={`cell-name-${product.id}`}>
                      {product.name}
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`cell-price-${product.id}`}>
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate" data-testid={`cell-description-${product.id}`}>
                      {product.description || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="h-8 w-8 p-0"
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingProduct(product)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        product={editingProduct}
      />
      <DeleteProductDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        product={deletingProduct}
      />
    </div>
  );
}
