import type { Product, ProductVariant } from "./types"

// Función para parsear CSV de Google Sheets
export function parseCSVToProducts(csvText: string): Product[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const products: Product[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    if (values.length < headers.length) continue
    
    const product = parseProductFromRow(headers, values, i)
    if (product.name) {
      products.push(product)
    }
  }
  
  return products
}

// Función para parsear una línea CSV correctamente (maneja comas dentro de comillas)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// Función para parsear un producto desde una fila
function parseProductFromRow(headers: string[], values: string[], rowIndex: number): Product {
  const product: any = {
    id: `product-${Date.now()}-${rowIndex}`,
    section: 'menu-principal',
    available: true,
    featured: false,
    hidden: false,
    stockControl: false,
    imageSize: 'medium',
    variantGroups: [],
    complements: []
  }
  
  // Mapear columnas a propiedades
  headers.forEach((header, index) => {
    const value = values[index]?.replace(/"/g, '').trim() || ''
    if (!value) return
    
    switch (header.toLowerCase()) {
      case 'nombre':
        product.name = value
        break
      case 'descripcion':
      case 'descripción':
        product.description = value
        break
      case 'categoria':
        product.category = normalizeCategoryName(value)
        break
      case 'precio':
        product.basePrice = parseFloat(value) || 0
        break
      case 'precio anterior':
        if (value) product.previousPrice = parseFloat(value)
        break
      case 'imagen (url)':
        product.image = value
        break
      // Procesar variedades
      case 'variedades 1 titulo':
      case 'variedades 1 título':
        product.var1Title = value
        break
      case 'variedades 1':
        product.var1 = value
        break
      case 'variedades 2 titulo':
      case 'variedades 2 título':
        product.var2Title = value
        break
      case 'variedades 2':
        product.var2 = value
        break
      case 'variedades 3 titulo':
      case 'variedades 3 título':
        product.var3Title = value
        break
      case 'variedades 3':
        product.var3 = value
        break
      case 'variedades 4 titulo':
      case 'variedades 4 título':
        product.var4Title = value
        break
      case 'variedades 4':
        product.var4 = value
        break
    }
  })
  
  // Crear grupos de variedades
  const variantGroups: Array<{title: string, variants: ProductVariant[]}> = []
  
  if (product.var1Title && product.var1) {
    variantGroups.push({
      title: product.var1Title,
      variants: parseVariants(product.var1)
    })
  }
  if (product.var2Title && product.var2) {
    variantGroups.push({
      title: product.var2Title,
      variants: parseVariants(product.var2)
    })
  }
  if (product.var3Title && product.var3) {
    variantGroups.push({
      title: product.var3Title,
      variants: parseVariants(product.var3)
    })
  }
  if (product.var4Title && product.var4) {
    variantGroups.push({
      title: product.var4Title,
      variants: parseVariants(product.var4)
    })
  }
  
  if (variantGroups.length > 0) {
    product.variantGroups = variantGroups
  }
  
  // Limpiar campos temporales
  delete product.var1
  delete product.var1Title
  delete product.var2
  delete product.var2Title
  delete product.var3
  delete product.var3Title
  delete product.var4
  delete product.var4Title
  
  return product as Product
}

// Función para parsear variedades del formato "Nombre: Precio, Nombre2: Precio2"
function parseVariants(variantsStr: string): ProductVariant[] {
  if (!variantsStr) return []
  
  return variantsStr.split(',').map(v => {
    const [name, priceStr] = v.split(':').map(s => s.trim())
    return {
      id: `var-${Date.now()}-${Math.random()}`,
      name: name || '',
      price: parseFloat(priceStr) || 0
    }
  }).filter(v => v.name)
}

// Normalizar nombre de categoría
function normalizeCategoryName(name: string): string {
  if (!name) return ''
  return name.toLowerCase().trim().charAt(0).toUpperCase() + name.toLowerCase().trim().slice(1)
}

// Función principal para cargar desde Google Sheets
export async function loadProductsFromGoogleSheets(sheetUrl: string): Promise<{
  products: Product[]
  categories: any[]
  sections: any[]
}> {
  try {
    const response = await fetch(sheetUrl)
    if (!response.ok) {
      throw new Error(`Error cargando Google Sheets: ${response.status}`)
    }
    
    const csvText = await response.text()
    const products = parseCSVToProducts(csvText)
    
    // Generar categorías automáticamente
    const categoryNames = new Set<string>()
    products.forEach(product => {
      if (product.category && product.category.trim()) {
        categoryNames.add(product.category)
      }
    })
    
    const categories = Array.from(categoryNames).map((name, index) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      order: index + 1,
      icon: getCategoryIcon(name)
    }))
    
    return {
      products,
      categories,
      sections: [
        { id: "destacados", name: "Destacados", description: "Nuestros platos más populares", order: 1 },
        { id: "menu-principal", name: "Menú Principal", order: 2 }
      ]
    }
  } catch (error) {
    console.error("Error cargando desde Google Sheets:", error)
    return {
      products: [],
      categories: [],
      sections: []
    }
  }
}

// Función auxiliar para asignar iconos según el nombre de la categoría
function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase()
  
  const iconMap: Record<string, string> = {
    'pizza': 'pizza',
    'pizzas': 'pizza',
    'empanada': 'utensils',
    'empanadas': 'utensils',
    'bebida': 'glass-water',
    'bebidas': 'glass-water',
    'postre': 'cake',
    'postres': 'cake',
    'helado': 'ice-cream',
    'helados': 'ice-cream',
    'pasta': 'utensils',
    'pastas': 'utensils',
    'hamburguesa': 'utensils',
    'hamburguesas': 'utensils',
    'ensalada': 'utensils',
    'ensaladas': 'utensils',
    'entrada': 'utensils',
    'entradas': 'utensils',
    'principal': 'utensils',
    'principales': 'utensils',
    'sandwich': 'utensils',
    'sandwiches': 'utensils',
  }
  
  return iconMap[name] || 'utensils'
}

