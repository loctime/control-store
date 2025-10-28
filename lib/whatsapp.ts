import type { CartItem, StoreConfig } from "./types"

export function generateWhatsAppMessage(
  cart: CartItem[],
  customerName: string,
  customerPhone: string,
  deliveryType: "delivery" | "pickup",
  deliveryAddress: string | undefined,
  notes: string | undefined,
  total: number,
  storeConfig: StoreConfig,
): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  let message = `*NUEVO PEDIDO*\n\n`
  message += `👤 *Cliente:* ${customerName}\n`
  message += `📱 *Teléfono:* ${customerPhone}\n`
  message += `📦 *Tipo:* ${deliveryType === "delivery" ? "Delivery" : "Retiro en local"}\n`

  if (deliveryType === "delivery" && deliveryAddress) {
    message += `📍 *Dirección:* ${deliveryAddress}\n`
  }

  message += `\n*PRODUCTOS:*\n`
  message += `━━━━━━━━━━━━━━━━\n`

  cart.forEach((item, index) => {
    message += `\n${index + 1}. *${item.product.name}*\n`

    if (item.variant) {
      message += `   • Tamaño: ${item.variant.name}\n`
    }

    if (item.complements.length > 0) {
      message += `   • Complementos:\n`
      item.complements.forEach((c) => {
        message += `     - ${c.complement.name} x${c.quantity}\n`
      })
    }

    if (item.notes) {
      message += `   • Nota: ${item.notes}\n`
    }

    const basePrice = item.variant?.price || item.product.basePrice
    const complementsPrice = item.complements.reduce((sum, c) => sum + c.complement.price * c.quantity, 0)
    const itemTotal = (basePrice + complementsPrice) * item.quantity

    message += `   • Cantidad: ${item.quantity}\n`
    message += `   • Subtotal: ${formatPrice(itemTotal)}\n`
  })

  message += `\n━━━━━━━━━━━━━━━━\n`
  message += `*TOTAL: ${formatPrice(total)}*\n`

  if (notes) {
    message += `\n📝 *Notas adicionales:*\n${notes}\n`
  }

  return message
}

export function sendWhatsAppOrder(message: string, phoneNumber: string): void {
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodedMessage}`
  window.open(whatsappUrl, "_blank")
}
