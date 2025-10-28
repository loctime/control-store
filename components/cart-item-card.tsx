"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CartItem } from "@/lib/types"
import { Minus, Plus, Trash2 } from "lucide-react"

interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void
  onRemove: (productId: string, variantId?: string) => void
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const basePrice = item.variant?.price || item.product.basePrice
  const complementsPrice = item.complements.reduce((sum, c) => sum + c.complement.price * c.quantity, 0)
  const itemTotal = (basePrice + complementsPrice) * item.quantity

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Imagen */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={item.product.image || "/placeholder.svg"}
              alt={item.product.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold leading-tight truncate">{item.product.name}</h3>
                {item.variant && <p className="text-sm text-muted-foreground">{item.variant.name}</p>}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="flex-shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemove(item.productId, item.variantId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Complementos */}
            {item.complements.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-1">Complementos:</p>
                <div className="flex flex-wrap gap-1">
                  {item.complements.map((c) => (
                    <span key={c.complement.id} className="text-xs bg-secondary px-2 py-1 rounded">
                      {c.complement.name} x{c.quantity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            {item.notes && <p className="text-xs text-muted-foreground italic mb-2">Nota: {item.notes}</p>}

            {/* Cantidad y precio */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1), item.variantId)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-lg font-bold text-primary">{formatPrice(itemTotal)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
