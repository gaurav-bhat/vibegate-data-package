import { useState } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@workspace/api-client-react';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductTable({ products, onEdit, onDelete, isLoading }: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium w-32">Price</TableHead>
              <TableHead className="font-medium">Description</TableHead>
              <TableHead className="font-medium w-36">Created</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground text-sm">No products found.</p>
        <p className="text-muted-foreground text-xs mt-1">
          Create your first product to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-medium">Name</TableHead>
            <TableHead className="font-medium w-32">Price</TableHead>
            <TableHead className="font-medium">Description</TableHead>
            <TableHead className="font-medium w-36">Created</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="hover-elevate"
              data-testid={`row-product-${product.id}`}
            >
              <TableCell className="font-medium" data-testid={`text-name-${product.id}`}>
                {product.name}
              </TableCell>
              <TableCell className="table-mono" data-testid={`text-price-${product.id}`}>
                ${product.price.toFixed(2)}
              </TableCell>
              <TableCell className="max-w-md">
                <div className="truncate text-muted-foreground text-sm">
                  {product.description || '—'}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(product.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`button-menu-${product.id}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEdit(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(product)}
                      className="text-destructive focus:text-destructive"
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
