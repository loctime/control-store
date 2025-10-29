import { useState } from "react"
import { getStoreCategories, syncCategoriesFromProducts } from "@/lib/stores"
import type { Product } from "@/lib/types"

export function useCategories(storeId: string | undefined) {
  const [categories, setCategories] = useState<any[]>([])

  const loadCategories = async () => {
    if (!storeId) return
    
    const cats = await getStoreCategories(storeId)
    if (cats.length > 0) {
      setCategories(cats)
    } else {
      // Fallback a categorías por defecto
      setCategories([
        { id: "pizzas", name: "Pizzas", icon: "pizza", order: 1 },
        { id: "empanadas", name: "Empanadas", icon: "utensils", order: 2 },
        { id: "bebidas", name: "Bebidas", icon: "glass-water", order: 3 },
        { id: "postres", name: "Postres", icon: "cake", order: 4 }
      ])
    }
  }

  const syncFromProducts = async (products: Product[]) => {
    if (!storeId) return
    
    await syncCategoriesFromProducts(storeId, products)
    const updated = await getStoreCategories(storeId)
    if (updated.length > 0) {
      setCategories(updated)
    }
  }

  return { categories, setCategories, loadCategories, syncFromProducts }
}

