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
import { ProductDialog } from "@/components/product-dialog"
import { DeleteProductDialog } from "@/components/delete-product-dialog"

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
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Products</h2>
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
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-sm font-medium text-card-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first product to get started.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">Price</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium text-card-foreground">{product.name}</TableCell>
                <TableCell className="tabular-nums">{currency.format(Number(product.price))}</TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  <span className="line-clamp-2">{product.description || "—"}</span>
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

      <ProductDialog open={formOpen} onOpenChange={setFormOpen} product={selected} />
      <DeleteProductDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={selected} />
    </div>
  )
}
