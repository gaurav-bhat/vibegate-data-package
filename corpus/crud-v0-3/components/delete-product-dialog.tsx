"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteProduct } from "@/app/actions/products"
import type { Product } from "@/lib/db/schema"
import { toast } from "sonner"

type DeleteProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!product) return
    startTransition(async () => {
      const result = await deleteProduct(product.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Product deleted.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete product</DialogTitle>
          <DialogDescription>
            {product ? (
              <>
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">{product.name}</span>? This action
                cannot be undone.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
