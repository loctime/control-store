"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { Plus } from "lucide-react"

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
        {product.featured && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">Destacado</Badge>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">No disponible</Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-2xl font-bold text-primary">{formatPrice(product.basePrice)}</p>
        {product.variants && product.variants.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Desde {formatPrice(Math.min(...product.variants.map((v) => v.price)))}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onAddToCart(product)} disabled={!product.available}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar
        </Button>
      </CardFooter>
    </Card>
  )
}
