"use client"

import { useStore } from "@/lib/store"
import { CartItemCard } from "@/components/cart-item-card"
import { CartSummary } from "@/components/cart-summary"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShoppingCart, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface CartSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeSlug: string
}

export function CartSidebar({ open, onOpenChange, storeSlug }: CartSidebarProps) {
  const router = useRouter()
  const { cart, removeFromCart, updateCartItemQuantity, getCartTotal, storeConfig } = useStore()

  const subtotal = getCartTotal()
  const deliveryFee = storeConfig.deliveryFee || 500
  const total = subtotal + deliveryFee
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    onOpenChange(false)
    router.push(`/${storeSlug}/checkout`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm flex flex-col p-0">
        {/* Header compacto */}
        <SheetHeader className="border-b px-3 py-2">
          <SheetTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span>Mi Carrito</span>
              {cartItemsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({cartItemsCount})
                </span>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col px-4">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/20 mb-2" />
              <h3 className="text-sm font-semibold mb-1">Tu carrito está vacío</h3>
              <p className="text-xs text-muted-foreground text-center mb-3">
                Agrega productos para comenzar
              </p>
              <Button 
                onClick={() => onOpenChange(false)} 
                size="sm"
                variant="outline"
              >
                Seguir comprando
              </Button>
            </div>
          ) : (
            <>
              {/* Lista de productos compacta */}
              <ScrollArea className="flex-1 px-2">
                <div className="space-y-1 py-2">
                  {cart.map((item) => (
                    <CartItemCard
                      key={`${item.productId}-${item.variantId || 'default'}`}
                      item={item}
                      onUpdateQuantity={updateCartItemQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Resumen compacto */}
              <div className="border-t bg-background p-3">
                <CartSummary
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                />

                {subtotal < storeConfig.minOrderAmount && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                    <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        Pedido mínimo no alcanzado
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Agrega{" "}
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }).format(storeConfig.minOrderAmount - subtotal)}{" "}
                        más
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 space-y-1.5">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleCheckout}
                    disabled={subtotal < storeConfig.minOrderAmount}
                  >
                    Proceder al checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Seguir comprando
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

