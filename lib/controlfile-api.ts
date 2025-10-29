import type { Product, Category } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_CONTROLFILE_URL || "https://controlfile.onrender.com"

interface SheetInfo {
  sheetId: string
  editUrl: string
  lastSyncedAt?: string
}

interface ControlfileProduct {
  id: string
  nombre: string
  descripcion: string
  variedades1?: string
  variedades1Titulo?: string
  variedades2?: string
  variedades2Titulo?: string
  variedades3?: string
  variedades3Titulo?: string
  variedades4?: string
  variedades4Titulo?: string
  categoria: string
  precio: number
  precioAnterior?: number
  imagenUrl?: string
  rowIndex: number
}

interface ControlfileResponse {
  success: boolean
  products?: ControlfileProduct[]
  categories?: string[]
  cached?: boolean
  count?: number
  sheetId?: string
  editUrl?: string
  backupUrl?: string
  error?: string
}

// Función para obtener el token de autenticación de Firebase
async function getAuthToken(): Promise<string> {
  const { getAuth } = await import('firebase/auth')
  const auth = getAuth()
  const user = auth.currentUser
  
  if (!user) {
    throw new Error('Usuario no autenticado')
  }
  
  const token = await user.getIdToken()
  return token
}

// Función para crear una hoja en el Drive del cliente
export async function createGoogleSheet(storeId: string, authCode: string): Promise<{ success: boolean, data?: SheetInfo, error?: string }> {
  try {
    const token = await getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/sheets/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authCode }),
    })
    
    const data: ControlfileResponse = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || "Error al crear la hoja de Google Sheets" }
    }
    
    return {
      success: true,
      data: {
        sheetId: data.sheetId!,
        editUrl: data.editUrl!,
        lastSyncedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error creating Google Sheet:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Función para obtener productos desde Google Sheets (a través del backend)
export async function getProductsFromSheets(storeId: string): Promise<{ success: boolean, data?: { products: Product[], categories: Category[] }, error?: string }> {
  try {
    const token = await getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    
    const data: ControlfileResponse = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || "Error al obtener productos desde Google Sheets" }
    }
    
    // Mapear productos de Controlfile a nuestra estructura
    const products: Product[] = (data.products || []).map(mapControlfileProductToProduct)
    
    // Crear categorías desde los productos
    const categories: Category[] = (data.categories || []).map((catName, index) => ({
      id: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: catName,
      icon: getCategoryIcon(catName),
      order: index + 1
    }))
    
    return {
      success: true,
      data: { products, categories }
    }
  } catch (error) {
    console.error('Error getting products from sheets:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Función para forzar la sincronización de productos desde Sheets
export async function syncProductsFromSheets(storeId: string): Promise<{ success: boolean, data?: { count: number }, error?: string }> {
  try {
    const token = await getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/sheets/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    
    const data: ControlfileResponse = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || "Error al sincronizar productos desde Google Sheets" }
    }
    
    return {
      success: true,
      data: { count: data.count || 0 }
    }
  } catch (error) {
    console.error('Error syncing products from sheets:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Función para crear un backup de la hoja
export async function createSheetBackup(storeId: string): Promise<{ success: boolean, data?: { backupUrl: string }, error?: string }> {
  try {
    const token = await getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/backup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    
    const data: ControlfileResponse = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || "Error al crear el backup de la hoja" }
    }
    
    return {
      success: true,
      data: { backupUrl: data.backupUrl! }
    }
  } catch (error) {
    console.error('Error creating backup:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Función para obtener información de la hoja configurada
export async function getSheetInfo(storeId: string): Promise<{ success: boolean, data?: SheetInfo, error?: string }> {
  try {
    const token = await getAuthToken()
    
    // Como Controlfile no tiene un endpoint específico para info de la hoja,
    // intentamos obtener productos para ver si hay una hoja configurada
    const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    
    if (response.status === 404) {
      return { success: true, data: undefined } // No sheet configured
    }
    
    if (!response.ok) {
      const data: ControlfileResponse = await response.json()
      return { success: false, error: data.error || "Error al obtener información de la hoja" }
    }
    
    // Si llegamos aquí, hay una hoja configurada pero no tenemos info específica
    // Retornamos un objeto genérico
    return {
      success: true,
      data: {
        sheetId: 'unknown',
        editUrl: 'https://docs.google.com/spreadsheets/',
        lastSyncedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching sheet info:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// Función para mapear productos de Controlfile a nuestra estructura
function mapControlfileProductToProduct(controlfileProduct: ControlfileProduct): Product {
  const variantGroups: Array<{ title: string; variants: Array<{ id: string; name: string; price: number }> }> = []
  
  // Procesar variedades 1
  if (controlfileProduct.variedades1 && controlfileProduct.variedades1Titulo) {
    const variants = parseVariantsString(controlfileProduct.variedades1)
    variantGroups.push({
      title: controlfileProduct.variedades1Titulo,
      variants
    })
  }
  
  // Procesar variedades 2
  if (controlfileProduct.variedades2 && controlfileProduct.variedades2Titulo) {
    const variants = parseVariantsString(controlfileProduct.variedades2)
    variantGroups.push({
      title: controlfileProduct.variedades2Titulo,
      variants
    })
  }
  
  // Procesar variedades 3
  if (controlfileProduct.variedades3 && controlfileProduct.variedades3Titulo) {
    const variants = parseVariantsString(controlfileProduct.variedades3)
    variantGroups.push({
      title: controlfileProduct.variedades3Titulo,
      variants
    })
  }
  
  // Procesar variedades 4
  if (controlfileProduct.variedades4 && controlfileProduct.variedades4Titulo) {
    const variants = parseVariantsString(controlfileProduct.variedades4)
    variantGroups.push({
      title: controlfileProduct.variedades4Titulo,
      variants
    })
  }
  
  return {
    id: controlfileProduct.id,
    name: controlfileProduct.nombre,
    description: controlfileProduct.descripcion,
    basePrice: controlfileProduct.precio,
    previousPrice: controlfileProduct.precioAnterior || undefined,
    image: controlfileProduct.imagenUrl || '',
    category: controlfileProduct.categoria,
    available: true,
    featured: false,
    hidden: false,
    stockControl: false,
    imageSize: 'medium' as const,
    section: 'menu-principal',
    variantGroups: variantGroups.length > 0 ? variantGroups : undefined,
    complements: undefined,
    variants: undefined
  }
}

// Función para parsear string de variedades
function parseVariantsString(variantsStr: string): Array<{ id: string; name: string; price: number }> {
  return variantsStr.split(',').map(v => {
    const parts = v.split(':').map(s => s.trim())
    const name = parts[0]
    const price = parseFloat(parts[1]) || 0
    return {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      price
    }
  }).filter(v => v.name)
}

// Función para obtener icono de categoría
function getCategoryIcon(categoryName: string): string {
  const iconMap: { [key: string]: string } = {
    'pizza': 'pizza',
    'pizzas': 'pizza',
    'empanada': 'utensils',
    'empanadas': 'utensils',
    'bebida': 'glass-water',
    'bebidas': 'glass-water',
    'postre': 'cake',
    'postres': 'cake',
    'ropa': 'shirt',
    'accesorio': 'star',
    'accesorios': 'star',
    'calzado': 'shoe-prints'
  }
  
  const normalizedName = categoryName.toLowerCase()
  return iconMap[normalizedName] || 'utensils'
}