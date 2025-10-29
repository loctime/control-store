"use client"

interface CartSummaryProps {
  subtotal: number
  deliveryFee: number
  total: number
}

export function CartSummary({ subtotal, deliveryFee, total }: CartSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Envío</span>
        <span className="font-medium">{deliveryFee > 0 ? formatPrice(deliveryFee) : "Gratis"}</span>
      </div>
      <div className="border-t pt-1">
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
