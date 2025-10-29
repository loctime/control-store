import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product, Category, Section, CartItem, StoreConfig } from "./types"

interface StoreState {
  // Productos y catálogo
  products: Product[]
  categories: Category[]
  sections: Section[]
  storeConfig: StoreConfig

  // Carrito
  cart: CartItem[]

  // Acciones de productos
  setProducts: (products: Product[]) => void
  setCategories: (categories: Category[]) => void
  setSections: (sections: Section[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void

  // Acciones de carrito
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string, variantId?: string) => void
  updateCartItemQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  getCartTotal: () => number

  // Configuración
  updateStoreConfig: (config: Partial<StoreConfig>) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      products: [],
      categories: [],
      sections: [],
      storeConfig: {
        name: "Mi Restaurante",
        phone: "+54 9 2944 99-7155",
        address: "Dirección del restaurante",
        deliveryFee: 500,
        minOrderAmount: 2000,
        openingHours: "Lun-Dom 11:00 - 23:00",
        contact: {
          welcomeMessage: "¡Bienvenidos a nuestra tienda! Realizamos pedidos online con delivery y retiro en local.",
          email: "",
          website: "",
          socialMedia: {
            whatsapp: "",
            instagram: "",
            facebook: "",
            twitter: ""
          }
        },
        location: {
          latitude: 0,
          longitude: 0,
          address: "",
          showMap: false
        },
        schedule: {
          monday: { open: "09:00", close: "22:00", closed: false },
          tuesday: { open: "09:00", close: "22:00", closed: false },
          wednesday: { open: "09:00", close: "22:00", closed: false },
          thursday: { open: "09:00", close: "22:00", closed: false },
          friday: { open: "09:00", close: "22:00", closed: false },
          saturday: { open: "09:00", close: "22:00", closed: false },
          sunday: { open: "09:00", close: "22:00", closed: false }
        },
        animations: {
          enableHover: true,
          enableTransitions: true,
          enableMicroInteractions: true,
          animationSpeed: "normal"
        }
      },
      cart: [],

      // Acciones de productos
      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      setSections: (sections) => set({ sections }),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (id, updatedProduct) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updatedProduct } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      // Acciones de carrito
      addToCart: (item) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId,
          )

          if (existingIndex >= 0) {
            const newCart = [...state.cart]
            newCart[existingIndex].quantity += item.quantity
            return { cart: newCart }
          }

          return { cart: [...state.cart, item] }
        }),

      removeFromCart: (productId, variantId) =>
        set((state) => ({
          cart: state.cart.filter((item) => !(item.productId === productId && item.variantId === variantId)),
        })),

      updateCartItemQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId && item.variantId === variantId ? { ...item, quantity } : item,
          ),
        })),

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        const state = get()
        return state.cart.reduce((total, item) => {
          const basePrice = item.variant?.price || item.product.basePrice
          const complementsPrice = item.complements.reduce((sum, c) => sum + c.complement.price * c.quantity, 0)
          return total + (basePrice + complementsPrice) * item.quantity
        }, 0)
      },

      // Configuración
      updateStoreConfig: (config) =>
        set((state) => ({
          storeConfig: { ...state.storeConfig, ...config },
        })),
    }),
    {
      name: "restaurant-store",
      partialize: (state) => ({
        cart: state.cart,
        storeConfig: state.storeConfig,
      }),
    },
  ),
)
