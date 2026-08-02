import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ProductTable } from '@/components/product-table';
import { ProductForm } from '@/components/product-form';
import { StatsCards } from '@/components/stats-cards';
import {
  useListProducts,
  getListProductsQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useGetProductStats,
  getGetProductStatsQueryKey,
  type Product,
} from '@workspace/api-client-react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Debounce search
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  const { data: products = [], isLoading: isLoadingProducts } = useListProducts(
    debouncedSearch ? { search: debouncedSearch } : undefined,
    {
      query: {
        queryKey: getListProductsQueryKey(debouncedSearch ? { search: debouncedSearch } : undefined),
      },
    }
  );

  const { data: stats, isLoading: isLoadingStats } = useGetProductStats({
    query: {
      queryKey: getGetProductStatsQueryKey(),
    },
  });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
        setIsCreateDialogOpen(false);
        toast({
          title: 'Product created',
          description: 'The product has been created successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to create product. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
        setEditingProduct(null);
        toast({
          title: 'Product updated',
          description: 'The product has been updated successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to update product. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
        setDeletingProduct(null);
        toast({
          title: 'Product deleted',
          description: 'The product has been deleted successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete product. Please try again.',
          variant: 'destructive',
        });
      },
    },
  });

  const handleCreate = (data: { name: string; price: number; description?: string }) => {
    createProduct.mutate({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
      },
    });
  };

  const handleUpdate = (data: { name: string; price: number; description?: string }) => {
    if (!editingProduct) return;
    updateProduct.mutate({
      id: editingProduct.id,
      data: {
        name: data.name,
        price: data.price,
        description: data.description || null,
      },
    });
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate({ id: deletingProduct.id });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Product Catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your product inventory and pricing
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsCards stats={stats} isLoading={isLoadingStats} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-add-product"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Table */}
        <ProductTable
          products={products}
          onEdit={setEditingProduct}
          onDelete={setDeletingProduct}
          isLoading={isLoadingProducts}
        />
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isPending={createProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details for this product.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleUpdate}
            onCancel={() => setEditingProduct(null)}
            isPending={updateProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
