"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Product, Category, Section } from "@/lib/types"
import { X, Plus } from "lucide-react"

interface ProductFormProps {
  product?: Product
  categories: Category[]
  sections: Section[]
  onSubmit: (product: Omit<Product, "id"> & { id?: string }) => void
  onCancel: () => void
}

export function ProductForm({ product, categories, sections, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    basePrice: product?.basePrice || 0,
    image: product?.image || "",
    category: product?.category || "",
    section: product?.section || "",
    available: product?.available ?? true,
    featured: product?.featured ?? false,
  })

  const [variants, setVariants] = useState(product?.variants || [])
  const [complements, setComplements] = useState(product?.complements || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...(product?.id && { id: product.id }),
      ...formData,
      variants: variants.length > 0 ? variants : undefined,
      complements: complements.length > 0 ? complements : undefined,
    })
  }

  const addVariant = () => {
    setVariants([...variants, { id: `variant-${Date.now()}`, name: "", price: 0 }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const addComplement = () => {
    setComplements([...complements, { id: `complement-${Date.now()}`, name: "", price: 0 }])
  }

  const removeComplement = (index: number) => {
    setComplements(complements.filter((_, i) => i !== index))
  }

  const updateComplement = (index: number, field: string, value: string | number) => {
    const newComplements = [...complements]
    newComplements[index] = { ...newComplements[index], [field]: value }
    setComplements(newComplements)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del producto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Precio base *</Label>
            <Input
              id="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number.parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">URL de imagen</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="/placeholder.svg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Sección *</Label>
            <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona sección" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
            />
            <Label htmlFor="available">Disponible</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            />
            <Label htmlFor="featured">Destacado</Label>
          </div>
        </div>
      </div>

      {/* Variantes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Variantes (opcional)</Label>
          <Button type="button" size="sm" variant="outline" onClick={addVariant}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
        {variants.map((variant, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Nombre (ej: Pequeña)"
              value={variant.name}
              onChange={(e) => updateVariant(index, "name", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Precio"
              value={variant.price}
              onChange={(e) => updateVariant(index, "price", Number.parseFloat(e.target.value) || 0)}
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => removeVariant(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Complementos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Complementos (opcional)</Label>
          <Button type="button" size="sm" variant="outline" onClick={addComplement}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
        {complements.map((complement, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Nombre (ej: Aceitunas)"
              value={complement.name}
              onChange={(e) => updateComplement(index, "name", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Precio"
              value={complement.price}
              onChange={(e) => updateComplement(index, "price", Number.parseFloat(e.target.value) || 0)}
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => removeComplement(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {product ? "Actualizar" : "Crear"} producto
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
