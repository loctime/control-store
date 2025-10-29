import { useState } from "react"
import { getProductsCollection, normalizeCategoryName, syncCategoriesFromProducts, getStoreCategories } from "@/lib/stores"
import { addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/types"

export function useProductForm(
  storeId: string | undefined,
  onProductSaved: () => void,
  onCategoriesUpdate: (categories: any[]) => void
) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleSubmitProduct = async (productData: Omit<Product, "id"> & { id?: string }) => {
    if (!storeId || !db) return

    try {
      const productsRef = getProductsCollection(storeId)
      
      const normalizedData = {
        ...productData,
        category: productData.category ? normalizeCategoryName(productData.category) : productData.category
      }
      
      if (normalizedData.id && editingProduct) {
        const productRef = doc(db, 'apps', 'control-store', 'stores', storeId, 'products', normalizedData.id)
        const { id, ...dataToUpdate } = normalizedData
        await updateDoc(productRef, dataToUpdate as any)
      } else {
        const { id, ...dataWithoutId } = normalizedData
        await addDoc(productsRef, dataWithoutId)
      }
      
      // Sincronizar categorías
      await syncCategoriesFromProducts(storeId, [])
      const updatedCategories = await getStoreCategories(storeId)
      if (updatedCategories.length > 0) {
        onCategoriesUpdate(updatedCategories)
      }
      
      onProductSaved()
      setIsDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error guardando producto:", error)
      alert("Error al guardar el producto")
    }
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  return {
    isDialogOpen,
    editingProduct,
    handleCreateProduct,
    handleEditProduct,
    handleSubmitProduct,
    closeDialog
  }
}

