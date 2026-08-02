import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListProducts,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetProductStatsQueryKey,
  type Product,
} from '@workspace/api-client-react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { ProductForm } from '@/components/product-form';
import { useCreateProduct, useUpdateProduct } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export function ProductTable() {
  const { data: products, isLoading } = useListProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleCreate = (data: { name: string; price: number; description?: string }) => {
    createProduct.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          setIsCreateOpen(false);
          toast({
            title: 'Product created',
            description: `${data.name} has been added to the catalog.`,
          });
        },
        onError: () => {
          toast({
            title: 'Failed to create product',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleUpdate = (data: { name: string; price: number; description?: string }) => {
    if (!editingProduct) return;
    
    updateProduct.mutate(
      { id: editingProduct.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          setEditingProduct(null);
          toast({
            title: 'Product updated',
            description: `${data.name} has been updated.`,
          });
        },
        onError: () => {
          toast({
            title: 'Failed to update product',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingProductId) return;
    
    deleteProduct.mutate(
      { id: deletingProductId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          setDeletingProductId(null);
          toast({
            title: 'Product deleted',
            description: 'The product has been removed from the catalog.',
          });
        },
        onError: () => {
          toast({
            title: 'Failed to delete product',
            description: 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="border border-card-border rounded-lg overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-card-border">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Product Catalog
          </h2>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="border border-card-border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Product Name
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Created
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-card-border transition-colors duration-150 hover:bg-primary/5"
                      data-testid={`row-product-${product.id}`}
                    >
                      <td className="px-6 py-4 font-medium" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-primary" data-testid={`text-product-price-${product.id}`}>
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-md truncate" data-testid={`text-product-description-${product.id}`}>
                        {product.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground" data-testid={`text-product-created-${product.id}`}>
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                            className="hover:bg-primary/10 hover:text-primary"
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingProductId(product.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-12 h-12 text-muted-foreground/40" />
                        <p className="text-muted-foreground">No products yet</p>
                        <Button onClick={() => setIsCreateOpen(true)} size="sm" data-testid="button-add-first-product">
                          <Plus className="w-4 h-4 mr-2" />
                          Add your first product
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={createProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProduct(null)}
              isSubmitting={updateProduct.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
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
    </>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
