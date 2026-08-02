"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProductFormDialog } from "@/components/product-form-dialog"
import { DeleteProductDialog } from "@/components/delete-product-dialog"
import type { Product } from "@/lib/db/schema"
import { Pencil, Plus, Trash2 } from "lucide-react"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function ProductsManager({ products }: { products: Product[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)

  function openAdd() {
    setSelected(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setSelected(product)
    setFormOpen(true)
  }

  function openDelete(product: Product) {
    setSelected(product)
    setDeleteOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"} total
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">Name</TableHead>
              <TableHead className="w-[15%]">Price</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  No products yet. Click &quot;Add product&quot; to create your first one.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell>{currency.format(Number(product.price))}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {product.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(product)}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={selected} />
      <DeleteProductDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={selected} />
    </div>
  )
}
