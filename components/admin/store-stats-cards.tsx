"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StoreStatsCardsProps {
  totalProducts?: number
  availableProducts?: number
  featuredProducts?: number
  totalStores?: number
}

export function StoreStatsCards({ 
  totalProducts = 0, 
  availableProducts = 0, 
  featuredProducts = 0,
  totalStores = 0 
}: StoreStatsCardsProps) {
  // Si tiene stores, mostrar grid de 4 columnas, sino 3
  const gridCols = totalStores > 0 ? "md:grid-cols-4" : "md:grid-cols-3"
  
  return (
    <div className={`grid ${gridCols} gap-4`}>
      {totalStores > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total tiendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalStores}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total productos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{totalProducts}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-500">
            {availableProducts}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Destacados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {featuredProducts}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

