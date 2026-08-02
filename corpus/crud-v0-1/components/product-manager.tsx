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
import { Pencil, Plus, Trash2 } from "lucide-react"
import type { Product } from "@/lib/db/schema"
import { ProductFormDialog } from "@/components/product-form-dialog"
import { DeleteProductDialog } from "@/components/delete-product-dialog"

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function ProductManager({ products }: { products: Product[] }) {
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
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-card-foreground">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"} total
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-sm text-muted-foreground">No products yet. Add your first product to get started.</p>
          <Button variant="outline" onClick={openAdd}>
            <Plus className="size-4" />
            Add product
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32 text-right">Price</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right tabular-nums">{currency.format(Number(product.price))}</TableCell>
                <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
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
            ))}
          </TableBody>
        </Table>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={selected} />
      <DeleteProductDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={selected} />
    </div>
  )
}
