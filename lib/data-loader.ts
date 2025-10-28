import type { Product, Category, Section } from "./types"

export async function loadProductsFromJSON(): Promise<{
  products: Product[]
  categories: Category[]
  sections: Section[]
}> {
  try {
    const response = await fetch("/data/products.json")
    if (!response.ok) {
      throw new Error("Error al cargar productos")
    }
    const data = await response.json()
    return {
      products: data.products || [],
      categories: data.categories || [],
      sections: data.sections || [],
    }
  } catch (error) {
    console.error("[v0] Error cargando productos:", error)
    return {
      products: [],
      categories: [],
      sections: [],
    }
  }
}
