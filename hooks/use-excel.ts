import { useState } from "react"
import * as XLSX from 'xlsx'
import { normalizeCategoryName } from "@/lib/stores"
import { getProductsCollection, syncCategoriesFromProducts, getStoreCategories } from "@/lib/stores"
import { getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, ProductVariant } from "@/lib/types"

interface ImportAnalysis {
  toDelete: number
  toAdd: number
  toEdit: number
  deleteList: string[]
  addList: string[]
}

export function useExcelImport(
  currentProducts: Product[],
  storeId: string | undefined,
  onImportComplete: () => void,
  onCategoriesSync: (categories: any[]) => void
) {
  const [isImporting, setIsImporting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingData, setPendingData] = useState<{
    productsToImport: any[]
    totalCurrent: number
    totalNew: number
    toDelete: number
    toAdd: number
    toEdit: number
    deleteList: string[]
    addList: string[]
  } | null>(null)

  const parseVariants = (variantsStr: string): ProductVariant[] => {
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

  const parseProductRow = (row: any): any => {
    const product: any = { variantGroups: [], section: 'menu-principal', available: true, featured: false }

    Object.keys(row).forEach((header) => {
      const value = row[header]
      if (value === undefined || value === null) return
      
      const strValue = String(value).trim()
      switch (header.toLowerCase()) {
        case 'nombre':
          product.name = strValue
          break
        case 'descripcion':
        case 'descripción':
          product.description = strValue
          break
        case 'precio':
          product.basePrice = parseFloat(strValue) || 0
          break
        case 'precio anterior':
          if (strValue) product.previousPrice = parseFloat(strValue)
          break
        case 'categoria':
          product.category = normalizeCategoryName(strValue || 'pizzas')
          break
        case 'subcategoria':
          if (strValue) product.subCategory = strValue
          break
        case 'ocultar':
          product.hidden = strValue.toLowerCase() === 'sí' || strValue.toLowerCase() === 'si' || strValue.toLowerCase() === 'yes' || strValue === '1'
          break
        case 'controlar stock':
          product.stockControl = strValue.toLowerCase() === 'sí' || strValue.toLowerCase() === 'si' || strValue.toLowerCase() === 'yes' || strValue === '1'
          break
        case 'tamaño imagen':
        case 'tamano imagen':
          if (strValue) product.imageSize = strValue.toLowerCase()
          break
        case 'imagen':
        case 'imagen (url)':
        case 'imagen (URL)':
          product.image = strValue
          break
        case 'variedades 1 titulo':
        case 'variedades 1 título':
          if (strValue) product.var1Title = strValue
          break
        case 'variedades 1':
          if (strValue) product.var1 = strValue
          break
        case 'variedades 2 titulo':
        case 'variedades 2 título':
          if (strValue) product.var2Title = strValue
          break
        case 'variedades 2':
          if (strValue) product.var2 = strValue
          break
        case 'variedades 3 titulo':
        case 'variedades 3 título':
          if (strValue) product.var3Title = strValue
          break
        case 'variedades 3':
          if (strValue) product.var3 = strValue
          break
        case 'variedades 4 titulo':
        case 'variedades 4 título':
          if (strValue) product.var4Title = strValue
          break
        case 'variedades 4':
          if (strValue) product.var4 = strValue
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

    // Eliminar campos temporales
    delete product.var1
    delete product.var1Title
    delete product.var2
    delete product.var2Title
    delete product.var3
    delete product.var3Title
    delete product.var4
    delete product.var4Title

    return product
  }

  const analyzeChanges = (productsToImport: any[]): ImportAnalysis => {
    const newProductNames = new Set(productsToImport.map(p => p.name.toLowerCase()))
    const currentProductNames = new Set(currentProducts.map(p => p.name.toLowerCase()))
    
    const toDelete = currentProducts.filter(p => !newProductNames.has(p.name.toLowerCase()))
    const toAdd = productsToImport.filter(p => !currentProductNames.has(p.name.toLowerCase()))
    const toEdit = productsToImport.filter(p => {
      const current = currentProducts.find(cp => cp.name.toLowerCase() === p.name.toLowerCase())
      if (!current) return false
      return current.basePrice !== p.basePrice || 
             current.description !== p.description ||
             current.category !== p.category ||
             current.available !== p.available ||
             current.featured !== p.featured
    })

    return {
      toDelete: toDelete.length,
      toAdd: toAdd.length,
      toEdit: toEdit.length,
      deleteList: toDelete.slice(0, 5).map(p => p.name),
      addList: toAdd.slice(0, 5).map(p => p.name)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet) as any[]

        if (!storeId || !db) {
          alert('Error: No hay tienda configurada')
          setIsImporting(false)
          return
        }

        const productsToImport = data
          .map(parseProductRow)
          .filter(p => p.name)

        const analysis = analyzeChanges(productsToImport)

        setPendingData({
          productsToImport,
          totalCurrent: currentProducts.length,
          totalNew: productsToImport.length,
          ...analysis
        })
        setIsConfirmOpen(true)
        setIsImporting(false)
      } catch (error) {
        console.error('Error procesando Excel:', error)
        alert('Error al procesar el archivo Excel')
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleConfirm = async () => {
    if (!pendingData || !storeId || !db) return
    
    setIsConfirmOpen(false)
    setIsImporting(true)
    
    try {
      const productsRef = getProductsCollection(storeId)
      const currentSnapshot = await getDocs(productsRef)
      const deletePromises = currentSnapshot.docs.map(async (docSnap) => {
        await deleteDoc(doc(db, 'apps', 'control-store', 'stores', storeId, 'products', docSnap.id))
      })
      await Promise.all(deletePromises)

      let added = 0
      for (const productData of pendingData.productsToImport) {
        try {
          await addDoc(productsRef, productData)
          added++
        } catch (error) {
          console.error('Error agregando producto:', error)
        }
      }

      if (added > 0) {
        await syncCategoriesFromProducts(storeId, pendingData.productsToImport)
        const updatedCategories = await getStoreCategories(storeId)
        if (updatedCategories.length > 0) {
          onCategoriesSync(updatedCategories)
        }
      }

      alert(`✅ Se importaron ${added} productos correctamente`)
      onImportComplete()
      setPendingData(null)
    } catch (error) {
      console.error('Error importando Excel:', error)
      alert('Error al importar el archivo Excel')
    } finally {
      setIsImporting(false)
    }
  }

  return {
    isImporting,
    isConfirmOpen,
    setIsConfirmOpen,
    pendingData,
    handleImport,
    handleConfirm,
    closeConfirm: () => {
      setIsConfirmOpen(false)
      setPendingData(null)
    }
  }
}

export function useExcelExport(products: Product[], storeSlug: string) {
  const serializeVariants = (groups?: Array<{title: string, variants: ProductVariant[]}>): string[] => {
    if (!groups || groups.length === 0) return ['', '', '', '']
    
    const result = ['', '', '', '']
    const titles = ['', '', '', '']
    
    groups.slice(0, 4).forEach((group, index) => {
      titles[index] = group.title
      result[index] = group.variants.map(v => `${v.name}: ${v.price}`).join(', ')
    })
    
    return [...titles, ...result]
  }

  const handleDownload = () => {
    const headers = [
      'Nombre', 'Descripcion', 'Variedades 1', 'Variedades 1 Titulo', 
      'Variedades 2', 'Variedades 2 Titulo', 'Variedades 3', 'Variedades 3 Titulo',
      'Variedades 4', 'Variedades 4 Titulo', 'Precio', 'Precio Anterior', 
      'Ocultar', 'Categoria', 'SubCategoria', 'Categoria Imagen de fondo', 
      'Categoria Icono', 'Controlar Stock', 'Tamaño Imagen', 'Imagen (URL)'
    ]
    
    const rows = products.map(p => {
      const vars = serializeVariants(p.variantGroups)
      return {
        'Nombre': p.name,
        'Descripcion': p.description || '',
        'Variedades 1': vars[4],
        'Variedades 1 Titulo': vars[0],
        'Variedades 2': vars[5],
        'Variedades 2 Titulo': vars[1],
        'Variedades 3': vars[6],
        'Variedades 3 Titulo': vars[2],
        'Variedades 4': vars[7],
        'Variedades 4 Titulo': vars[3],
        'Precio': p.basePrice,
        'Precio Anterior': p.previousPrice || '',
        'Ocultar': p.hidden ? 'Sí' : 'No',
        'Categoria': p.category || '',
        'SubCategoria': p.subCategory || '',
        'Categoria Imagen de fondo': '',
        'Categoria Icono': '',
        'Controlar Stock': p.stockControl ? 'Sí' : 'No',
        'Tamaño Imagen': p.imageSize || 'medium',
        'Imagen (URL)': p.image || ''
      }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')

    const filename = products.length > 0 
      ? `productos-${storeSlug}-${new Date().toISOString().split('T')[0]}.xlsx`
      : `plantilla-productos.xlsx`
    
    XLSX.writeFile(wb, filename)
  }

  return { handleDownload }
}

