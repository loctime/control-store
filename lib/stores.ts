import { db } from './firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion 
} from 'firebase/firestore'
import type { Store, Invitation, User, Product, Category } from './types'

// Constante para el nombre de la app en la estructura compartida
const APP_ID = 'control-store'

// Verificar si Firebase está disponible
function checkFirebaseConnection() {
  if (!db) {
    const hasApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_REBASE_API_KEY
    const hasAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_REBASE_AUTH_DOMAIN
    const hasProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_REBASE_PROJECT_ID
    
    const missing = []
    if (!hasApiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY')
    if (!hasAuthDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')
    if (!hasProjectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
    
    if (missing.length > 0) {
      throw new Error(`Firebase no está inicializado. Faltan variables: ${missing.join(', ')}. Verifica tu archivo .env.local`)
    }
    throw new Error('Firebase no está inicializado. Verifica tus variables de entorno en .env.local')
  }
}

// Funciones auxiliares para crear referencias a colecciones
const getStoresCollection = () => {
  checkFirebaseConnection()
  return collection(db, 'apps', APP_ID, 'stores')
}
const getInvitationsCollection = () => {
  checkFirebaseConnection()
  return collection(db, 'apps', APP_ID, 'invitations')
}
const getStoreDoc = (storeId: string) => {
  checkFirebaseConnection()
  return doc(db, 'apps', APP_ID, 'stores', storeId)
}
export const getProductsCollection = (storeId: string) => {
  checkFirebaseConnection()
  return collection(db, 'apps', APP_ID, 'stores', storeId, 'products')
}

// ===== STORES =====

export async function createStore(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(getStoresCollection(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getAllStores(): Promise<Store[]> {
  const querySnapshot = await getDocs(getStoresCollection())
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Store[]
}

export async function deleteStore(storeId: string): Promise<void> {
  const storeRef = getStoreDoc(storeId)
  await deleteDoc(storeRef)
}

export async function deleteStoreCompletely(storeId: string): Promise<void> {
  try {
    // 1. Obtener datos de la tienda antes de eliminarla
    const store = await getStoreById(storeId)
    if (!store) {
      throw new Error("Tienda no encontrada")
    }

    // 2. Eliminar todos los productos
    const products = await getStoreProducts(storeId)
    for (const product of products) {
      await deleteProductFromStore(storeId, product.id)
    }

    // 3. Eliminar todas las categorías
    const categories = await getStoreCategories(storeId)
    for (const category of categories) {
      const categoryRef = doc(db, 'apps', APP_ID, 'stores', storeId, 'categories', category.id)
      await deleteDoc(categoryRef)
    }

    // 4. Remover la tienda del array de stores del usuario
    await removeStoreFromUser(store.ownerId, storeId)

    // 5. Eliminar la tienda
    await deleteStore(storeId)

    console.log(`Tienda ${storeId} eliminada completamente`)
  } catch (error) {
    console.error("Error eliminando tienda completamente:", error)
    throw error
  }
}

export async function removeStoreFromUser(userId: string, storeId: string): Promise<void> {
  const userRef = doc(db, 'apps', APP_ID, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    const userData = userSnap.data()
    const stores = userData.stores || []
    const updatedStores = stores.filter((id: string) => id !== storeId)
    
    await updateDoc(userRef, {
      stores: updatedStores,
      updatedAt: serverTimestamp(),
    })
  }
}

export async function updateStoreOwner(storeId: string, newOwnerEmail: string, newOwnerId: string): Promise<void> {
  const storeRef = getStoreDoc(storeId)
  await updateDoc(storeRef, {
    ownerEmail: newOwnerEmail,
    ownerId: newOwnerId,
    updatedAt: serverTimestamp(),
  })
}

export async function createTransferLink(storeId: string): Promise<string> {
  const token = generateTransferToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 1) // Expira en 24 horas
  
  const transferData = {
    token,
    storeId,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp(),
    used: false,
  }
  
  const docRef = await addDoc(collection(db, 'apps', APP_ID, 'transfers'), transferData)
  
  // Generar URL de transferencia
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tudominio.com'
  return `${baseUrl}/admin/transfer/${token}`
}

function generateTransferToken(): string {
  return `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export async function getTransferByToken(token: string): Promise<any> {
  if (!token || typeof token !== 'string') {
    throw new Error("Token de transferencia inválido")
  }
  
  const q = query(collection(db, 'apps', APP_ID, 'transfers'), where('token', '==', token))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  const transferData = { id: doc.id, ...doc.data() }
  
  // Verificar si no ha expirado
  const now = new Date()
  const expiresAt = transferData.expiresAt.toDate()
  
  if (now > expiresAt) {
    return null // Expirado
  }
  
  // Obtener datos de la tienda
  const store = await getStoreById(transferData.storeId)
  return { ...transferData, store }
}

export async function completeTransfer(token: string, newOwnerEmail: string, newOwnerId: string): Promise<void> {
  // Obtener datos de transferencia
  const transferData = await getTransferByToken(token)
  if (!transferData) {
    throw new Error("Token de transferencia no válido")
  }
  
  const storeId = transferData.storeId
  
  // Actualizar dueño de la tienda
  await updateStoreOwner(storeId, newOwnerEmail, newOwnerId)
  
  // Agregar tienda al usuario (crea el documento si no existe)
  await addStoreToUser(newOwnerId, storeId, newOwnerEmail)
  
  // Marcar transferencia como usada
  const q = query(collection(db, 'apps', APP_ID, 'transfers'), where('token', '==', token))
  const querySnapshot = await getDocs(q)
  
  if (!querySnapshot.empty) {
    const transferRef = querySnapshot.docs[0].ref
    await updateDoc(transferRef, {
      used: true,
      usedByEmail: newOwnerEmail,
      usedById: newOwnerId,
      usedAt: serverTimestamp(),
    })
  }
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  if (!slug) return null
  
  const q = query(getStoresCollection(), where('slug', '==', slug))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Store
}

export async function getStoreById(id: string): Promise<Store | null> {
  const docRef = getStoreDoc(id)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as Store
}

export async function updateStoreConfig(storeId: string, config: Partial<Store['config']>): Promise<void> {
  const storeRef = getStoreDoc(storeId)
  await updateDoc(storeRef, {
    config,
    updatedAt: serverTimestamp(),
  })
}

// ===== INVITATIONS =====

export async function createInvitation(storeName: string): Promise<string> {
  const token = generateInvitationToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días
  
  const invitationData: Omit<Invitation, 'id' | 'createdAt'> = {
    token,
    storeName,
    used: false,
    expiresAt: Timestamp.fromDate(expiresAt),
  }
  
  const docRef = await addDoc(getInvitationsCollection(), {
    ...invitationData,
    createdAt: serverTimestamp(),
  })
  
  return token
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const q = query(getInvitationsCollection(), where('token', '==', token))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Invitation
}

export async function markInvitationAsUsed(token: string, email: string, userId: string): Promise<void> {
  const q = query(getInvitationsCollection(), where('token', '==', token))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) return
  
  const docRef = querySnapshot.docs[0].ref
  await updateDoc(docRef, {
    used: true,
    usedByEmail: email,
    usedById: userId,
  })
}

function generateInvitationToken(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Verificar si el slug está disponible
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales
    .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
}

// Verificar disponibilidad del slug
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await getStoreBySlug(slug)
  return existing === null
}

// Verificar si un usuario ya tiene una tienda (deprecado - ahora permitimos múltiples)
export async function getUserStoreByEmail(email: string): Promise<Store | null> {
  const q = query(getStoresCollection(), where('ownerEmail', '==', email))
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) return null
  
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Store
}

// Crear o actualizar documento de usuario
export async function ensureUserDocument(userId: string, email: string, displayName?: string): Promise<void> {
  const userRef = doc(db, 'apps', APP_ID, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (!userSnap.exists()) {
    // Crear nuevo usuario
    await setDoc(userRef, {
      email,
      displayName: displayName || email.split('@')[0],
      stores: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    // Actualizar si cambió el nombre
    if (displayName && userSnap.data().displayName !== displayName) {
      await updateDoc(userRef, {
        displayName,
        updatedAt: serverTimestamp(),
      })
    }
  }
}

// Agregar tienda al array de stores del usuario
export async function addStoreToUser(userId: string, storeId: string, userEmail?: string): Promise<void> {
  const userRef = doc(db, 'apps', APP_ID, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (!userSnap.exists()) {
    // Crear el documento del usuario si no existe
    await setDoc(userRef, {
      email: userEmail || '',
      displayName: userEmail ? userEmail.split('@')[0] : 'Usuario',
      stores: [storeId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    await updateDoc(userRef, {
      stores: arrayUnion(storeId),
      updatedAt: serverTimestamp(),
    })
  }
}

// Obtener tiendas de un usuario
export async function getUserStores(userId: string): Promise<Store[]> {
  const userRef = doc(db, 'apps', APP_ID, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (!userSnap.exists()) return []
  
  const storeIds = userSnap.data().stores || []
  if (storeIds.length === 0) return []
  
  // Obtener todas las tiendas del usuario
  const stores = await Promise.all(
    storeIds.map(async (storeId: string) => {
      return await getStoreById(storeId)
    })
  )
  
  return stores.filter(Boolean) as Store[]
}

// Verificar si un usuario es owner de una tienda específica
export async function isUserOwnerOfStore(userId: string, storeSlug: string): Promise<boolean> {
  const store = await getStoreBySlug(storeSlug)
  if (!store) return false
  
  return store.ownerId === userId
}

// ===== PRODUCTS =====

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  const productsRef = getProductsCollection(storeId)
  const snapshot = await getDocs(productsRef)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
}

export async function addProductToStore(storeId: string, product: Omit<Product, 'id'>): Promise<string> {
  const productsRef = getProductsCollection(storeId)
  const docRef = await addDoc(productsRef, product)
  return docRef.id
}

export async function updateProductInStore(storeId: string, productId: string, product: Partial<Product>): Promise<void> {
  const productRef = doc(db, 'apps', APP_ID, 'stores', storeId, 'products', productId)
  await updateDoc(productRef, product as any)
}

export async function deleteProductFromStore(storeId: string, productId: string): Promise<void> {
  const productRef = doc(db, 'apps', APP_ID, 'stores', storeId, 'products', productId)
  await deleteDoc(productRef)
}

// ===== CATEGORIES =====

const getCategoriesCollection = (storeId: string) => {
  checkFirebaseConnection()
  return collection(db, 'apps', APP_ID, 'stores', storeId, 'categories')
}

// Normalizar nombre de categoría: primera letra mayúscula, resto minúsculas
export function normalizeCategoryName(name: string): string {
  if (!name) return ''
  // Convertir todo a minúsculas y capitalizar primera letra
  return name.toLowerCase().trim().charAt(0).toUpperCase() + name.toLowerCase().trim().slice(1)
}

// Obtener todas las categorías de una tienda
export async function getStoreCategories(storeId: string): Promise<Category[]> {
  const categoriesRef = getCategoriesCollection(storeId)
  const snapshot = await getDocs(categoriesRef)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Category[]
}

// Crear o actualizar categorías automáticamente desde productos
export async function syncCategoriesFromProducts(storeId: string, products: Product[]): Promise<Category[]> {
  // Extraer categorías únicas de los productos
  const categoryNames = new Set<string>()
  
  products.forEach(product => {
    if (product.category && product.category.trim()) {
      categoryNames.add(normalizeCategoryName(product.category))
    }
  })
  
  // Obtener categorías existentes
  const existingCategories = await getStoreCategories(storeId)
  const existingCategoryNames = new Set(existingCategories.map(c => c.name))
  
  // Crear nuevas categorías
  const newCategories: string[] = []
  categoryNames.forEach(categoryName => {
    if (!existingCategoryNames.has(categoryName)) {
      newCategories.push(categoryName)
    }
  })
  
  // Crear documentos para nuevas categorías
  const categoriesRef = getCategoriesCollection(storeId)
  let order = existingCategories.length + 1
  
  for (const categoryName of newCategories) {
    const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await setDoc(doc(categoriesRef, categoryId), {
      name: categoryName,
      id: categoryId,
      order: order++,
      icon: getCategoryIcon(categoryName),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  
  // Eliminar categorías que ya no existan en los productos
  const categoriesToDelete = existingCategories.filter(c => !categoryNames.has(c.name))
  for (const category of categoriesToDelete) {
    try {
      await deleteDoc(doc(categoriesRef, category.id))
    } catch (err) {
      // Ignorar errores de borrado individuales para no interrumpir toda la sincronización
      // Podría loguearse en el futuro si es necesario
    }
  }
  
  // Retornar todas las categorías (existentes + nuevas)
  return await getStoreCategories(storeId)
}

// Función auxiliar para asignar iconos según el nombre de la categoría
function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase()
  
  // Mapeo de iconos comunes
  const iconMap: Record<string, string> = {
    'pizza': 'pizza',
    'pizzas': 'pizza',
    'empanada': 'utensils',
    'empanadas': 'utensils',
    'bebida': 'glass-water',
    'bebidas': 'glass-water',
    'bebida sin alcohol': 'glass-water',
    'bebida con alcohol': 'wine',
    'cerveza': 'wine',
    'cervezas': 'wine',
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

