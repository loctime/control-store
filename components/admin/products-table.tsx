"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

interface ProductsTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  // Memoizar handlers para evitar re-renders innecesarios
  const handleEdit = useCallback((product: Product) => {
    onEdit(product)
  }, [onEdit])

  const handleDelete = useCallback((productId: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      onDelete(productId)
    }
  }, [onDelete])

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
    <>
      {/* Vista Mobile - Cards */}
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 shrink-0">
                  {product.category}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-2 flex-wrap">
                  {product.available ? (
                    <Badge variant="default" className="bg-green-500 text-white text-xs">
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">No disponible</Badge>
                  )}
                  {product.featured && (
                    <Badge variant="default" className="text-xs">Destacado</Badge>
                  )}
                </div>
                <p className="font-bold text-lg text-primary ml-2">
                  {formatPrice(product.basePrice)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEdit(product)} 
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleDelete(product.id)} 
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block rounded-md border">
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
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
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
    </>
  )
}

