"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StoreStatsCardsProps {
  totalProducts: number
  availableProducts: number
  featuredProducts: number
}

export function StoreStatsCards({ totalProducts, availableProducts, featuredProducts }: StoreStatsCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
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

