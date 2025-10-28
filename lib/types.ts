// Tipos principales de la aplicación

export interface ProductVariant {
  id: string
  name: string
  price: number
}

export interface ProductComplement {
  id: string
  name: string
  price: number
  maxQuantity?: number
}

export interface Product {
  id: string
  name: string
  description: string
  basePrice: number
  image: string
  category: string
  section: string
  variants?: ProductVariant[]
  complements?: ProductComplement[]
  available: boolean
  featured?: boolean
}

export interface Category {
  id: string
  name: string
  icon?: string
  order: number
}

export interface Section {
  id: string
  name: string
  description?: string
  order: number
}

export interface CartItem {
  productId: string
  product: Product
  variantId?: string
  variant?: ProductVariant
  complements: Array<{
    complement: ProductComplement
    quantity: number
  }>
  quantity: number
  notes?: string
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  customerName: string
  customerPhone: string
  deliveryType: "delivery" | "pickup"
  deliveryAddress?: string
  notes?: string
  createdAt: string
}

export interface StoreConfig {
  name: string
  phone: string
  address: string
  deliveryFee: number
  minOrderAmount: number
  openingHours: string
}
