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
  previousPrice?: number
  image: string
  category: string
  subCategory?: string
  section: string
  variants?: ProductVariant[]
  variantGroups?: Array<{
    title: string
    variants: ProductVariant[]
  }>
  complements?: ProductComplement[]
  available: boolean
  featured: boolean
  stockControl?: boolean
  stock?: number
  imageSize?: 'small' | 'medium' | 'large'
  hidden?: boolean
}

export interface Category {
  id: string
  name: string
  icon?: string
  backgroundImage?: string
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
  googleSheetsUrl?: string
  
  // Personalización visual
  branding?: {
    logo?: string
    logoIcon?: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    backgroundColor?: string
    textColor?: string
    borderRadius?: 'sm' | 'md' | 'lg' | 'xl'
  }
  
  // Fondos por sección
  backgrounds?: {
    featured?: {
      image?: string
      color?: string
      overlay?: number
    }
    menu?: {
      image?: string
      color?: string
      overlay?: number
    }
    categories?: {
      [categoryId: string]: {
        image?: string
        color?: string
        overlay?: number
      }
    }
  }
  
  // Configuración de UI
  ui?: {
    showPrices?: boolean
    showDescriptions?: boolean
    productImageSize?: 'small' | 'medium' | 'large'
    cardStyle?: 'minimal' | 'detailed' | 'compact'
    layout?: 'grid' | 'list'
  }
}

export interface Store {
  id: string
  slug: string
  name: string
  ownerEmail: string
  ownerId: string
  config: StoreConfig
  createdAt: Date | any
  updatedAt: Date | any
}

export interface Invitation {
  id: string
  token: string
  storeName: string
  used: boolean
  usedByEmail?: string
  usedById?: string
  expiresAt: Date | any
  createdAt: Date | any
}

export interface User {
  id: string
  email: string
  displayName?: string
  stores: string[] // Array de IDs de tiendas
  createdAt: Date | any
  updatedAt: Date | any
}
