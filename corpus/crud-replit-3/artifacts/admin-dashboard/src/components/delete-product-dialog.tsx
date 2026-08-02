import { useQueryClient } from '@tanstack/react-query';
import {
  useDeleteProduct,
  getListProductsQueryKey,
  getGetProductStatsQueryKey,
} from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
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

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    if (!product) return;

    deleteProduct.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProductStatsQueryKey() });
          toast({
            title: 'Product deleted',
            description: `${product.name} has been removed from the catalog.`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Failed to delete product',
            description: error.message || 'An error occurred while deleting the product.',
          });
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-delete-product">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{product?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
