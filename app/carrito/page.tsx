"use client"

import { useStore } from "@/lib/store"
import { CartItemCard } from "@/components/cart-item-card"
import { CartSummary } from "@/components/cart-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const router = useRouter()
  const { cart, updateCartItemQuantity, removeFromCart, getCartTotal, storeConfig } = useStore()

  const subtotal = getCartTotal()
  const deliveryFee = subtotal >= storeConfig.minOrderAmount ? 0 : storeConfig.deliveryFee
  const total = subtotal + deliveryFee

  const handleUpdateQuantity = (productId: string, quantity: number, variantId?: string) => {
    updateCartItemQuantity(productId, quantity, variantId)
  }

  const handleRemove = (productId: string, variantId?: string) => {
    removeFromCart(productId, variantId)
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Carrito</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-secondary rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
              <p className="text-muted-foreground">Agrega productos para comenzar tu pedido</p>
            </div>
            <Link href="/">
              <Button size="lg" className="w-full">
                Ver menú
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Carrito</h1>
              <p className="text-sm text-muted-foreground">
                {cart.length} {cart.length === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <CartItemCard
                key={`${item.productId}-${item.variantId || "default"}`}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}

            {/* Mensaje de envío gratis */}
            {subtotal < storeConfig.minOrderAmount && (
              <div className="bg-accent border border-border rounded-lg p-4 text-sm">
                <p className="text-foreground">
                  Te faltan{" "}
                  <span className="font-bold">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 0,
                    }).format(storeConfig.minOrderAmount - subtotal)}
                  </span>{" "}
                  para envío gratis
                </p>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <CartSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
              <Button size="lg" className="w-full" onClick={handleCheckout}>
                Continuar con el pedido
              </Button>
              <Link href="/">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  Seguir comprando
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
