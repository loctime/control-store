"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { animations } from "@/components/ui/animations"
import { 
  Clock, 
  AlertTriangle, 
  Star, 
  Zap, 
  Flame, 
  Heart,
  TrendingUp,
  Shield
} from "lucide-react"
import type { Product } from "@/lib/types"

interface ProductStatusBadgeProps {
  product: Product
  className?: string
  showDiscount?: boolean
  showStock?: boolean
  showPreparationTime?: boolean
}

export function ProductStatusBadge({ 
  product, 
  className,
  showDiscount = true,
  showStock = true,
  showPreparationTime = true
}: ProductStatusBadgeProps) {
  const badges = []

  // Badge de descuento
  if (showDiscount && product.discount?.percentage) {
    badges.push({
      key: 'discount',
      content: `-${product.discount.percentage}%`,
      variant: 'destructive' as const,
      icon: TrendingUp,
      className: "bg-red-500 text-white border-red-500 animate-pulse"
    })
  }

  // Badge de precio anterior
  if (product.previousPrice && product.previousPrice > product.basePrice) {
    const discount = Math.round(((product.previousPrice - product.basePrice) / product.previousPrice) * 100)
    if (discount > 0) {
      badges.push({
        key: 'price-discount',
        content: `-${discount}%`,
        variant: 'destructive' as const,
        icon: TrendingUp,
        className: "bg-red-500 text-white border-red-500"
      })
    }
  }

  // Badge de estado del producto
  if (product.status) {
    switch (product.status) {
      case 'out_of_stock':
        badges.push({
          key: 'out-of-stock',
          content: 'Agotado',
          variant: 'secondary' as const,
          icon: AlertTriangle,
          className: "bg-gray-500 text-white border-gray-500"
        })
        break
      case 'coming_soon':
        badges.push({
          key: 'coming-soon',
          content: 'Próximamente',
          variant: 'outline' as const,
          icon: Clock,
          className: "bg-blue-50 text-blue-700 border-blue-200"
        })
        break
      case 'limited_stock':
        badges.push({
          key: 'limited-stock',
          content: 'Últimas unidades',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          className: "bg-orange-500 text-white border-orange-500 animate-pulse"
        })
        break
    }
  } else if (!product.available) {
    badges.push({
      key: 'unavailable',
      content: 'No disponible',
      variant: 'secondary' as const,
      icon: AlertTriangle,
      className: "bg-gray-500 text-white border-gray-500"
    })
  }

  // Badge de stock limitado
  if (showStock && product.stockControl && product.stock !== undefined) {
    if (product.stock === 0) {
      badges.push({
        key: 'no-stock',
        content: 'Sin stock',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: "bg-red-500 text-white border-red-500"
      })
    } else if (product.stock <= 5) {
      badges.push({
        key: 'low-stock',
        content: `Quedan ${product.stock}`,
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: "bg-orange-500 text-white border-orange-500"
      })
    }
  }

  // Badge de tiempo de preparación
  if (showPreparationTime && product.preparationTime) {
    badges.push({
      key: 'prep-time',
      content: `${product.preparationTime} min`,
      variant: 'outline' as const,
      icon: Clock,
      className: "bg-blue-50 text-blue-700 border-blue-200"
    })
  }

  // Badge de destacado
  if (product.featured) {
    badges.push({
      key: 'featured',
      content: 'Destacado',
      variant: 'default' as const,
      icon: Star,
      className: "bg-yellow-500 text-white border-yellow-500"
    })
  }

  // Badge de tags especiales
  if (product.tags) {
    product.tags.forEach((tag, index) => {
      const tagConfig = getTagConfig(tag)
      if (tagConfig) {
        badges.push({
          key: `tag-${index}`,
          content: tagConfig.label,
          variant: tagConfig.variant,
          icon: tagConfig.icon,
          className: tagConfig.className
        })
      }
    })
  }

  // Badge de calorías
  if (product.calories) {
    badges.push({
      key: 'calories',
      content: `${product.calories} cal`,
      variant: 'outline' as const,
      icon: Flame,
      className: "bg-green-50 text-green-700 border-green-200"
    })
  }

  // Badge de alérgenos
  if (product.allergens && product.allergens.length > 0) {
    badges.push({
      key: 'allergens',
      content: 'Alérgenos',
      variant: 'outline' as const,
      icon: Shield,
      className: "bg-purple-50 text-purple-700 border-purple-200"
    })
  }

  if (badges.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((badge) => {
        const Icon = badge.icon
        return (
          <Badge
            key={badge.key}
            variant={badge.variant}
            className={cn(
              "text-xs font-medium px-2 py-1 flex items-center gap-1",
              badge.className,
              animations.smooth
            )}
          >
            <Icon className="w-3 h-3" />
            {badge.content}
          </Badge>
        )
      })}
    </div>
  )
}

// Configuración de tags especiales
function getTagConfig(tag: string) {
  const tagMap: Record<string, {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: any
    className: string
  }> = {
    'nuevo': {
      label: 'Nuevo',
      variant: 'default',
      icon: Star,
      className: 'bg-green-500 text-white border-green-500'
    },
    'popular': {
      label: 'Popular',
      variant: 'default',
      icon: TrendingUp,
      className: 'bg-blue-500 text-white border-blue-500'
    },
    'recomendado': {
      label: 'Recomendado',
      variant: 'default',
      icon: Heart,
      className: 'bg-pink-500 text-white border-pink-500'
    },
    'especial': {
      label: 'Especial',
      variant: 'default',
      icon: Zap,
      className: 'bg-purple-500 text-white border-purple-500'
    },
    'temporada': {
      label: 'Temporada',
      variant: 'outline',
      icon: Flame,
      className: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    'vegano': {
      label: 'Vegano',
      variant: 'outline',
      icon: Shield,
      className: 'bg-green-50 text-green-700 border-green-200'
    },
    'sin-gluten': {
      label: 'Sin Gluten',
      variant: 'outline',
      icon: Shield,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }

  return tagMap[tag.toLowerCase()]
}
