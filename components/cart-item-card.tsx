"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-2 hover:shadow-sm transition-shadow">
      <div className="flex gap-2">
        {/* Imagen compacta */}
        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden">
          <Image
            src={item.product.image || "/placeholder.svg"}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Nombre y botón eliminar */}
          <div className="flex justify-between items-start gap-1 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight truncate">{item.product.name}</h3>
              {item.variant && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0 h-6 w-6 text-destructive hover:text-destructive p-0"
              onClick={() => onRemove(item.productId, item.variantId)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Complementos compactos */}
          {item.complements.length > 0 && (
            <div className="mb-1">
              <div className="flex flex-wrap gap-1">
                {item.complements.map((c) => (
                  <span key={c.complement.id} className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {c.complement.name} x{c.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notas compactas */}
          {item.notes && (
            <p className="text-[10px] text-muted-foreground italic mb-1 truncate">
              Nota: {item.notes}
            </p>
          )}

          {/* Cantidad y precio en línea */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 bg-transparent p-0"
                onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1), item.variantId)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-5 text-center font-medium text-sm">{item.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 bg-transparent p-0"
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm font-bold text-primary">{formatPrice(itemTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
