"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProduct, updateProduct } from "@/app/actions/products"
import type { Product } from "@/lib/db/schema"
import { toast } from "sonner"

type ProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const isEditing = Boolean(product)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const input = {
      name: String(formData.get("name") ?? ""),
      price: String(formData.get("price") ?? ""),
      description: String(formData.get("description") ?? ""),
    }

    if (!input.name.trim()) {
      toast.error("Please enter a product name.")
      return
    }

    startTransition(async () => {
      try {
        if (isEditing && product) {
          await updateProduct(product.id, input)
          toast.success("Product updated.")
        } else {
          await createProduct(input)
          toast.success("Product added.")
        }
        onOpenChange(false)
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details for this product."
                : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name ?? ""}
                placeholder="Wireless headphones"
                autoComplete="off"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.price ?? ""}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={product?.description ?? ""}
                placeholder="A short description of the product."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
