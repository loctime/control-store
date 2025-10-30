"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MessageCircle, StoreIcon, Truck } from "lucide-react"
import Link from "next/link"
import { generateWhatsAppMessage, sendWhatsAppOrder } from "@/lib/whatsapp"
import { formatPrice } from "@/lib/utils"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, storeConfig, clearCart } = useStore()

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = getCartTotal()
  const deliveryFee = deliveryType === "delivery" && subtotal < storeConfig.minOrderAmount ? storeConfig.deliveryFee : 0
  const total = subtotal + deliveryFee

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customerName.trim()) {
      newErrors.customerName = "El nombre es requerido"
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = "El teléfono es requerido"
    } else if (!/^\+?[\d\s-]+$/.test(customerPhone)) {
      newErrors.customerPhone = "Formato de teléfono inválido"
    }

    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = "La dirección es requerida para delivery"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const message = generateWhatsAppMessage(
      cart,
      customerName,
      customerPhone,
      deliveryType,
      deliveryAddress,
      notes,
      total,
      storeConfig,
    )

    sendWhatsAppOrder(message, storeConfig.phone)
    clearCart()
    router.push("/pedido-enviado")
  }

  if (cart.length === 0) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/carrito">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Finalizar pedido</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información de contacto</CardTitle>
              <CardDescription>Necesitamos estos datos para confirmar tu pedido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={errors.customerName ? "border-destructive" : ""}
                />
                {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 9 2944 123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={errors.customerPhone ? "border-destructive" : ""}
                />
                {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Tipo de entrega */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={deliveryType}
                onValueChange={(value) => setDeliveryType(value as "delivery" | "pickup")}
              >
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          {deliveryFee > 0 ? `Costo: ${formatPrice(deliveryFee)}` : "Envío gratis"}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <StoreIcon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">Retiro en local</p>
                        <p className="text-sm text-muted-foreground">{storeConfig.address}</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {deliveryType === "delivery" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="address">Dirección de entrega *</Label>
                  <Textarea
                    id="address"
                    placeholder="Calle, número, piso, departamento, referencias"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    className={errors.deliveryAddress ? "border-destructive" : ""}
                  />
                  {errors.deliveryAddress && <p className="text-sm text-destructive">{errors.deliveryAddress}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Notas adicionales</CardTitle>
              <CardDescription>Información extra sobre tu pedido (opcional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ej: Timbre roto, tocar puerta. Sin cebolla en las empanadas."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Resumen del pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.map((item) => {
                  const basePrice = item.variant?.price || item.product.basePrice
                  const complementsPrice = item.complements.reduce((sum, c) => sum + c.complement.price * c.quantity, 0)
                  const itemTotal = (basePrice + complementsPrice) * item.quantity

                  return (
                    <div
                      key={`${item.productId}-${item.variantId || "default"}`}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.product.name} {item.variant && `(${item.variant.name})`} x{item.quantity}
                      </span>
                      <span className="font-medium">{formatPrice(itemTotal)}</span>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium">{deliveryFee > 0 ? formatPrice(deliveryFee) : "Gratis"}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Botón de envío */}
          <Button type="submit" size="lg" className="w-full">
            <MessageCircle className="w-5 h-5 mr-2" />
            Enviar pedido por WhatsApp
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Al hacer clic, se abrirá WhatsApp con tu pedido listo para enviar
          </p>
        </form>
      </main>
    </div>
  )
}
