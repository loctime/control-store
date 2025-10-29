"use client"

import { useStore } from "@/lib/store"
import { CartItemCard } from "@/components/cart-item-card"
import { CartSummary } from "@/components/cart-summary"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { ShoppingCart, AlertCircle } from "lucide-react"
import Link from "next/link"
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
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span>Mi Carrito</span>
            {cartItemsCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({cartItemsCount} {cartItemsCount === 1 ? "producto" : "productos"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col px-6">
              <ShoppingCart className="w-24 h-24 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tu carrito está vacío</h3>
              <p className="text-sm text-muted-foreground text-center">
                Agrega productos para comenzar tu pedido
              </p>
              <Button 
                onClick={() => onOpenChange(false)} 
                className="mt-6"
                variant="outline"
              >
                Seguir comprando
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4 py-6">
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

              <div className="border-t bg-background p-6">
                <CartSummary
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                />

                {subtotal < storeConfig.minOrderAmount && (
                  <div className="flex items-start gap-2 mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        Pedido mínimo no alcanzado
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 mt-1">
                        Agrega{" "}
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 0,
                        }).format(storeConfig.minOrderAmount - subtotal)}{" "}
                        más para realizar el pedido
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={subtotal < storeConfig.minOrderAmount}
                  >
                    Proceder al checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
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

