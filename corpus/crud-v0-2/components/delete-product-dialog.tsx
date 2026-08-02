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
  product?: Product | null
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!product) return
    startTransition(async () => {
      try {
        await deleteProduct(product.id)
        toast.success("Product deleted.")
        onOpenChange(false)
      } catch {
        toast.error("Could not delete the product. Please try again.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete product</DialogTitle>
          <DialogDescription>
            {product
              ? `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
