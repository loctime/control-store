"use client"

import { useEffect, useState, use } from "react"
import { useStore } from "@/lib/store"
import { ProductCard } from "@/components/product-card"
import { ProductDetailModal } from "@/components/product-detail-modal"
import { CategoryFilter } from "@/components/category-filter"
import { CartSidebar } from "@/components/cart-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product, CartItem } from "@/lib/types"
import type { Store } from "@/lib/types"
import { ShoppingCart, Store as StoreIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { getStoreBySlug, getStoreCategories } from "@/lib/stores"
import { getProductsFromSheets } from "@/lib/controlfile-api"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

interface StorePageProps {
  params: Promise<{
    storeSlug: string
  }>
}

export default function StorePage({ params }: StorePageProps) {
  const resolvedParams = use(params)
  const { addToCart, cart } = useStore()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    loadStoreData()
  }, [resolvedParams.storeSlug])

  async function loadStoreData() {
    try {
      setIsLoading(true)
      
      // Cargar información de la tienda
      const storeData = await getStoreBySlug(resolvedParams.storeSlug)
      if (!storeData) {
        console.error("Tienda no encontrada")
        return
      }
      setStore(storeData)

      // Cargar productos desde Firestore (flujo híbrido)
      // La tienda pública siempre lee desde Firestore para máxima velocidad
      // Verificar que db esté disponible
      if (!db) {
        console.warn("Firebase no está inicializado")
        setProducts([])
        return
      }
      
      const productsRef = collection(db, 'apps', 'control-store', 'stores', storeData.id, 'products')
      const productsSnapshot = await getDocs(productsRef)
      
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      
      setProducts(productsData)

      // Cargar categorías dinámicamente desde Firestore
      const storeCategories = await getStoreCategories(storeData.id)
      
      if (storeCategories.length > 0) {
        setCategories(storeCategories)
      } else {
        // Fallback a categorías por defecto si no hay categorías en Firestore
        setCategories([
          { id: "pizzas", name: "Pizzas", icon: "pizza", order: 1 },
          { id: "empanadas", name: "Empanadas", icon: "utensils", order: 2 },
          { id: "bebidas", name: "Bebidas", icon: "glass-water", order: 3 },
          { id: "postres", name: "Postres", icon: "cake", order: 4 }
        ])
      }
      
      setSections([
        { id: "destacados", name: "Destacados", description: "Nuestros platos más populares", order: 1 },
        { id: "menu-principal", name: "Menú Principal", order: 2 }
      ])
    } catch (error) {
      console.error("Error cargando tienda:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-lg text-muted-foreground">Cargando tienda...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <StoreIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
          <p className="text-muted-foreground mb-4">La tienda que buscas no existe o fue eliminada.</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StoreIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold leading-tight">{store.config.name}</h1>
                <p className="text-xs text-muted-foreground">Pedidos online</p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Destacados */}
        {featuredProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onProductClick={handleProductClick} />
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
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onProductClick={handleProductClick} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay productos en esta categoría</p>
            </div>
          )}
        </section>
      </main>

      {/* Modal de detalle de producto */}
      <ProductDetailModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Sidebar del carrito */}
      <CartSidebar
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        storeSlug={resolvedParams.storeSlug}
      />
    </div>
  )
}

