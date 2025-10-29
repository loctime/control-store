"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { Plus, ChevronRight } from "lucide-react"

interface ProductCardProps {
  product: Product
  onProductClick: (product: Product) => void
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleCardClick = () => {
    onProductClick(product)
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border p-2 hover:shadow-sm transition-all duration-200 cursor-pointer group hover:border-primary/50"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-2">
        {/* Imagen compacta */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
          <Image 
            src={product.image || "/placeholder.svg"} 
            alt={product.name} 
            fill 
            className="object-cover" 
          />
          {product.featured && (
            <Badge className="absolute top-0.5 right-0.5 text-[10px] px-1 py-0 h-3 bg-primary text-primary-foreground">
              ★
            </Badge>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-3">No disp.</Badge>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Nombre y precio en línea */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <h3 className="font-medium text-sm leading-tight truncate group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm font-bold text-primary flex-shrink-0">
              {formatPrice(product.basePrice)}
            </p>
          </div>
          
          {/* Descripción y variantes */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-xs text-muted-foreground truncate flex-1">
              {product.description}
            </p>
            {product.variants && product.variants.length > 0 && (
              <p className="text-[10px] text-muted-foreground flex-shrink-0">
                Desde {formatPrice(Math.min(...product.variants.map((v) => v.price)))}
              </p>
            )}
          </div>

          {/* Botón agregar y flecha */}
          <div className="flex items-center justify-between">
            <Button 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onProductClick(product)
              }}
              disabled={!product.available}
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar
            </Button>
            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
