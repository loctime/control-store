"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { Product, ProductVariant, ProductComplement, CartItem } from "@/lib/types"
import { Minus, Plus, ShoppingCart } from "lucide-react"

interface ProductDetailModalProps {
  product: Product | null
  open: boolean
  onClose: () => void
  onAddToCart: (item: CartItem) => void
}

export function ProductDetailModal({ product, open, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedComplements, setSelectedComplements] = useState<Map<string, number>>(new Map())
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleComplementToggle = (complement: ProductComplement, checked: boolean) => {
    const newComplements = new Map(selectedComplements)
    if (checked) {
      newComplements.set(complement.id, 1)
    } else {
      newComplements.delete(complement.id)
    }
    setSelectedComplements(newComplements)
  }

  const handleComplementQuantityChange = (complementId: string, delta: number) => {
    const newComplements = new Map(selectedComplements)
    const current = newComplements.get(complementId) || 0
    const newQuantity = Math.max(0, current + delta)

    if (newQuantity === 0) {
      newComplements.delete(complementId)
    } else {
      newComplements.set(complementId, newQuantity)
    }

    setSelectedComplements(newComplements)
  }

  const calculateTotal = () => {
    if (!product) return 0

    const basePrice = selectedVariant?.price || product.basePrice
    const complementsPrice = Array.from(selectedComplements.entries()).reduce((sum, [id, qty]) => {
      const complement = product.complements?.find((c) => c.id === id)
      return sum + (complement?.price || 0) * qty
    }, 0)

    return (basePrice + complementsPrice) * quantity
  }

  const handleAddToCart = () => {
    if (!product) return

    const complements = Array.from(selectedComplements.entries())
      .map(([id, qty]) => {
        const complement = product.complements?.find((c) => c.id === id)
        return complement ? { complement, quantity: qty } : null
      })
      .filter((c): c is { complement: ProductComplement; quantity: number } => c !== null)

    const cartItem: CartItem = {
      productId: product.id,
      product,
      variantId: selectedVariant?.id,
      variant: selectedVariant || undefined,
      complements,
      quantity,
      notes: notes.trim() || undefined,
    }

    onAddToCart(cartItem)
    handleClose()
  }

  const handleClose = () => {
    setSelectedVariant(null)
    setSelectedComplements(new Map())
    setQuantity(1)
    setNotes("")
    onClose()
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagen del producto */}
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tamaño</Label>
              <RadioGroup
                value={selectedVariant?.id || ""}
                onValueChange={(value) => {
                  const variant = product.variants?.find((v) => v.id === value)
                  setSelectedVariant(variant || null)
                }}
              >
                {product.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent">
                    <RadioGroupItem value={variant.id} id={variant.id} />
                    <Label htmlFor={variant.id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>{variant.name}</span>
                        <span className="font-semibold text-primary">{formatPrice(variant.price)}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Complementos */}
          {product.complements && product.complements.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Complementos</Label>
              <div className="space-y-2">
                {product.complements.map((complement) => {
                  const isSelected = selectedComplements.has(complement.id)
                  const complementQty = selectedComplements.get(complement.id) || 0

                  return (
                    <div key={complement.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <Checkbox
                          id={complement.id}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleComplementToggle(complement, checked as boolean)}
                        />
                        <Label htmlFor={complement.id} className="cursor-pointer flex-1">
                          <div className="flex justify-between items-center">
                            <span>{complement.name}</span>
                            <span className="text-sm font-semibold text-primary">+{formatPrice(complement.price)}</span>
                          </div>
                        </Label>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleComplementQuantityChange(complement.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{complementQty}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => handleComplementQuantityChange(complement.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas especiales (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin cebolla, bien cocido, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label>Cantidad</Label>
            <div className="flex items-center gap-4">
              <Button size="icon" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
              <Button size="icon" variant="outline" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-left">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(calculateTotal())}</p>
          </div>
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!product.available || (product.variants && product.variants.length > 0 && !selectedVariant)}
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
