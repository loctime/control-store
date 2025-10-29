import { useState } from "react"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getProductsCollection } from "@/lib/stores"
import type { Product } from "@/lib/types"

export function useProducts(storeId: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const productsRef = getProductsCollection(storeId)
      const snapshot = await getDocs(productsRef)
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(productsData)
    } catch (error) {
      console.error("Error cargando productos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createProduct = async (productData: Omit<Product, "id">) => {
    const productsRef = getProductsCollection(storeId)
    const docRef = await addDoc(productsRef, productData)
    const newProduct = { ...productData, id: docRef.id } as Product
    setProducts([...products, newProduct])
    return newProduct
  }

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    const productRef = doc(db, 'apps', 'control-store', 'stores', storeId, 'products', productId)
    await updateDoc(productRef, productData as any)
    setProducts(products.map(p => p.id === productId ? { ...p, ...productData } : p))
  }

  const deleteProduct = async (productId: string) => {
    const productRef = doc(db, 'apps', 'control-store', 'stores', storeId, 'products', productId)
    await deleteDoc(productRef)
    setProducts(products.filter(p => p.id !== productId))
  }

  return {
    products,
    isLoading,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct
  }
}

