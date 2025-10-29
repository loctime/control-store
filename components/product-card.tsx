"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductStatusBadge } from "@/components/product-status-badge"
import { animations, HoverAnimation, StaggeredAnimation } from "@/components/ui/animations"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"
import { Plus, ChevronRight, Star } from "lucide-react"

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
    <StaggeredAnimation>
      <HoverAnimation variant="lift">
        <div 
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg border p-2 cursor-pointer group relative overflow-hidden",
            animations.hoverGlow,
            animations.smooth,
            "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
          )}
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-2">
            {/* Imagen compacta */}
            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
              <Image 
                src={product.image || "/placeholder.svg"} 
                alt={product.name} 
                fill 
                className={cn(
                  "object-cover transition-transform duration-300 group-hover:scale-110",
                  animations.smooth
                )} 
              />
              
              {/* Overlay para productos no disponibles */}
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
                <h3 className={cn(
                  "font-medium text-sm leading-tight truncate transition-colors",
                  animations.smooth,
                  "group-hover:text-primary"
                )}>
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {product.previousPrice && product.previousPrice > product.basePrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.previousPrice)}
                    </span>
                  )}
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(product.basePrice)}
                  </p>
                </div>
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

              {/* Badges de estado */}
              <div className="mb-2">
                <ProductStatusBadge 
                  product={product}
                  showDiscount={true}
                  showStock={true}
                  showPreparationTime={false}
                  className="text-xs"
                />
              </div>

              {/* Botón agregar y flecha */}
              <div className="flex items-center justify-between">
                <Button 
                  size="sm" 
                  className={cn(
                    "h-6 px-2 text-xs transition-all duration-200",
                    animations.tapScale,
                    "hover:bg-primary/90 hover:scale-105"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onProductClick(product)
                  }}
                  disabled={!product.available}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
                <ChevronRight className={cn(
                  "w-3 h-3 text-muted-foreground flex-shrink-0 transition-colors",
                  animations.smooth,
                  "group-hover:text-primary"
                )} />
              </div>
            </div>
          </div>
      </HoverAnimation>
    </StaggeredAnimation>
  )
}
