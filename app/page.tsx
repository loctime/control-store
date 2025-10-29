"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { loadProductsFromJSON } from "@/lib/data-loader"
import { ProductCard } from "@/components/product-card"
import { ProductDetailModal } from "@/components/product-detail-modal"
import { CategoryFilter } from "@/components/category-filter"
import { StoreThemeProvider } from "@/components/store-theme-provider"
import { WelcomeMessage } from "@/components/welcome-message"
import { StoreSchedule } from "@/components/store-schedule"
import { StoreLocation } from "@/components/store-location"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product, CartItem } from "@/lib/types"
import { ShoppingCart, Store } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { products, categories, sections, setProducts, setCategories, setSections, addToCart, cart } = useStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const data = await loadProductsFromJSON()
      setProducts(data.products)
      setCategories(data.categories)
      setSections(data.sections)
      setIsLoading(false)
    }
    loadData()
  }, [setProducts, setCategories, setSections])

  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product)
    } else if (product.complements && product.complements.length > 0) {
      setSelectedProduct(product)
    } else {
      const cartItem: CartItem = {
        productId: product.id,
        product,
        complements: [],
        quantity: 1,
      }
      addToCart(cartItem)
    }
  }

  const handleAddToCart = (item: CartItem) => {
    addToCart(item)
  }

  const filteredProducts = selectedCategory ? products.filter((p) => p.category === selectedCategory) : products

  const featuredProducts = products.filter((p) => p.featured && p.available)

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-lg text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <StoreThemeProvider store={null}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold leading-tight">Mi Restaurante</h1>
                  <p className="text-xs text-muted-foreground">Pedidos online</p>
                </div>
              </div>
              <Link href="/carrito">
                <Button size="lg" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Mensaje de bienvenida */}
        <WelcomeMessage storeConfig={storeConfig} />

        {/* Destacados */}
        {featuredProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {featuredProducts.map((product, index) => (
                <div key={product.id} style={{ animationDelay: `${index * 100}ms` }}>
                  <ProductCard product={product} onProductClick={handleProductClick} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtro de categorías */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Menú</h2>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* Lista de productos */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {filteredProducts.map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 50}ms` }}>
                <ProductCard product={product} onProductClick={handleProductClick} />
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay productos en esta categoría</p>
            </div>
          )}
        </section>

        {/* Información de la tienda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StoreSchedule storeConfig={storeConfig} />
          <StoreLocation storeConfig={storeConfig} />
        </div>
      </main>

      {/* Modal de detalle de producto */}
      <ProductDetailModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
      </div>
    </StoreThemeProvider>
  )
}
