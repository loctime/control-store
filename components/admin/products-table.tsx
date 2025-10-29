"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductsTableProps {
  products: Product[]
  formatPrice: (price: number) => string
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

export function ProductsTable({ products, formatPrice, onEdit, onDelete }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay productos. Crea uno nuevo para comenzar.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {product.description}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {product.category}
                </Badge>
              </TableCell>
              <TableCell>{formatPrice(product.basePrice)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {product.available ? (
                    <Badge variant="default" className="bg-green-500">
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No disponible</Badge>
                  )}
                  {product.featured && <Badge variant="default">Destacado</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

