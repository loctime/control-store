"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth"
import { getStoreBySlug, isUserOwnerOfStore, getProductsCollection, normalizeCategoryName, syncCategoriesFromProducts, getStoreCategories, updateStoreConfig } from "@/lib/stores"
import { createGoogleSheet, syncProductsFromSheets, createSheetBackup } from "@/lib/controlfile-api"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, Store, ProductVariant } from "@/lib/types"
import * as XLSX from 'xlsx'
import { ProductForm } from "@/components/admin/product-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StoreAdminHeader } from "@/components/admin/store-admin-header"
import { StoreStatsCards } from "@/components/admin/store-stats-cards"
import { ProductsTable } from "@/components/admin/products-table"
import { ProductsActions } from "@/components/admin/products-actions"
import { ImportConfirmationDialog } from "@/components/admin/import-confirmation-dialog"
import { GoogleSheetsConfigDialog } from "@/components/admin/google-sheets-config-dialog"
import { AdminAuthGate } from "@/components/admin/admin-auth-gate"

export default function StoreAdminPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImportData, setPendingImportData] = useState<any>(null)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [sheetInfo, setSheetInfo] = useState<any>(null)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  useEffect(() => {
    if (!auth) return
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await checkStoreAccess(currentUser.uid)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [resolvedParams.storeSlug])

  async function checkStoreAccess(userId: string) {
    try {
      const storeData = await getStoreBySlug(resolvedParams.storeSlug)
      if (!storeData) {
        alert("Tienda no encontrada")
        router.push("/")
        return
      }

      setStore(storeData)

      const isOwner = await isUserOwnerOfStore(userId, resolvedParams.storeSlug)
      setIsAuthenticated(isOwner)

      if (isOwner) {
        await loadProducts(storeData.id)
        const categories = await getStoreCategories(storeData.id)
        if (categories.length > 0) {
          setCategoriesList(categories)
        } else {
          setCategoriesList([
            { id: "pizzas", name: "Pizzas", icon: "pizza", order: 1 },
            { id: "empanadas", name: "Empanadas", icon: "utensils", order: 2 },
            { id: "bebidas", name: "Bebidas", icon: "glass-water", order: 3 },
            { id: "postres", name: "Postres", icon: "cake", order: 4 }
          ])
        }
        
        if (storeData.config.googleSheetsUrl) {
          setGoogleSheetsUrl(storeData.config.googleSheetsUrl)
        }
        
        await loadSheetInfo(storeData.id)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error verificando acceso:", error)
      setIsLoading(false)
    }
  }

  async function loadProducts(storeId: string) {
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
    }
  }

  const loadSheetInfo = async (storeId: string) => {
    try {
      const { getSheetInfo } = await import('@/lib/controlfile-api')
      const response = await getSheetInfo(storeId)
      if (response.success && response.data) {
        setSheetInfo(response.data)
      } else {
        setSheetInfo(null)
      }
    } catch (error) {
      console.error('Error cargando información de la hoja:', error)
      setSheetInfo(null)
    }
  }

  const handleLogin = async () => {
    if (!auth) return
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error en login:", error)
    }
  }

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
    router.push(`/${resolvedParams.storeSlug}`)
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return
    if (!store) return

    try {
      if (!db) return
      const productRef = doc(db, 'apps', 'control-store', 'stores', store.id, 'products', productId)
      await deleteDoc(productRef)
      const updatedProducts = products.filter(p => p.id !== productId)
      setProducts(updatedProducts)
      await syncCategoriesFromProducts(store.id, updatedProducts)
      const updatedCategories = await getStoreCategories(store.id)
      if (updatedCategories.length > 0) {
        setCategoriesList(updatedCategories)
      }
    } catch (error) {
      console.error("Error eliminando producto:", error)
      alert("Error al eliminar el producto")
    }
  }

  const handleSubmitProduct = async (productData: Omit<Product, "id"> & { id?: string }) => {
    if (!store) return

    try {
      const productsRef = getProductsCollection(store.id)
      
      const normalizedData = {
        ...productData,
        category: productData.category ? normalizeCategoryName(productData.category) : productData.category
      }
      
      if (normalizedData.id && editingProduct) {
        if (!db) return
        const productRef = doc(db, 'apps', 'control-store', 'stores', store.id, 'products', normalizedData.id)
        const { id, ...dataToUpdate } = normalizedData
        await updateDoc(productRef, dataToUpdate as any)
        setProducts(products.map(p => p.id === normalizedData.id ? { ...normalizedData } as Product : p))
      } else {
        const { id, ...dataWithoutId } = normalizedData
        const docRef = await addDoc(productsRef, dataWithoutId)
        const newProduct = { ...dataWithoutId, id: docRef.id } as Product
        setProducts([...products, newProduct])
      }
      
      const allProducts = editingProduct 
        ? products.map(p => p.id === normalizedData.id ? { ...normalizedData } as Product : p)
        : [...products, { ...normalizedData, id: (normalizedData.id || '') } as Product]
      await syncCategoriesFromProducts(store.id, allProducts)
      
      const updatedCategories = await getStoreCategories(store.id)
      if (updatedCategories.length > 0) {
        setCategoriesList(updatedCategories)
      }
      
      setIsDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error guardando producto:", error)
      alert("Error al guardar el producto")
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

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

  const handleDownloadTemplate = () => {
    const headers = [
      'Nombre', 'Descripcion', 'Variedades 1', 'Variedades 1 Titulo', 
      'Variedades 2', 'Variedades 2 Titulo', 'Variedades 3', 'Variedades 3 Titulo',
      'Variedades 4', 'Variedades 4 Titulo', 'Precio', 'Precio Anterior', 
      'Ocultar', 'Categoria', 'SubCategoria', 'Categoria Imagen de fondo', 
      'Categoria Icono', 'Controlar Stock', 'Tamaño Imagen', 'Imagen (URL)'
    ]
    
    let rows: any[] = []
    
    if (products.length > 0) {
      rows = products.map(p => {
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
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')

    const filename = products.length > 0 
      ? `productos-${resolvedParams.storeSlug}-${new Date().toISOString().split('T')[0]}.xlsx`
      : `plantilla-productos.xlsx`
    
    XLSX.writeFile(wb, filename)
  }

  const handleImportCSV = () => {
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

        if (!store) return

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

        const productsToImport = []
        
        for (const row of data) {
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

          delete product.var1
          delete product.var1Title
          delete product.var2
          delete product.var2Title
          delete product.var3
          delete product.var3Title
          delete product.var4
          delete product.var4Title

          if (product.name) {
            productsToImport.push(product)
          }
        }

        const newProductNames = new Set(productsToImport.map(p => p.name.toLowerCase()))
        const currentProductNames = new Set(products.map(p => p.name.toLowerCase()))
        
        const toDelete = products.filter(p => !newProductNames.has(p.name.toLowerCase()))
        const toAdd = productsToImport.filter(p => !currentProductNames.has(p.name.toLowerCase()))
        const toEdit = productsToImport.filter(p => {
          const current = products.find(cp => cp.name.toLowerCase() === p.name.toLowerCase())
          if (!current) return false
          return current.basePrice !== p.basePrice || 
                 current.description !== p.description ||
                 current.category !== p.category ||
                 current.available !== p.available ||
                 current.featured !== p.featured
        })

        setPendingImportData({
          productsToImport,
          totalCurrent: products.length,
          totalNew: productsToImport.length,
          toDelete: toDelete.length,
          toAdd: toAdd.length,
          toEdit: toEdit.length,
          deleteList: toDelete.slice(0, 5).map(p => p.name),
          addList: toAdd.slice(0, 5).map(p => p.name)
        })
        setIsImportConfirmOpen(true)
        setIsImporting(false)
        return
      } catch (error) {
        console.error('Error procesando Excel:', error)
        alert('Error al procesar el archivo Excel')
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleConfirmImport = async () => {
    if (!pendingImportData || !store) return
    
    setIsImportConfirmOpen(false)
    setIsImporting(true)
    
    try {
      if (!db) return
      const productsRef = getProductsCollection(store.id)
      const currentSnapshot = await getDocs(productsRef)
      const deletePromises = currentSnapshot.docs.map(async (docSnap) => {
        await deleteDoc(doc(db, 'apps', 'control-store', 'stores', store.id, 'products', docSnap.id))
      })
      await Promise.all(deletePromises)

      let added = 0
      for (const productData of pendingImportData.productsToImport) {
        try {
          await addDoc(productsRef, productData)
          added++
        } catch (error) {
          console.error('Error agregando producto:', error)
        }
      }

      if (added > 0) {
        await syncCategoriesFromProducts(store.id, pendingImportData.productsToImport)
        const updatedCategories = await getStoreCategories(store.id)
        if (updatedCategories.length > 0) {
          setCategoriesList(updatedCategories)
        }
      }

      alert(`✅ Se importaron ${added} productos correctamente`)
      await loadProducts(store.id)
      setPendingImportData(null)
    } catch (error) {
      console.error('Error importando Excel:', error)
      alert('Error al importar el archivo Excel')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCreateGoogleSheet = async () => {
    if (!store) return
    
    setIsCreatingSheet(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${origin}/api/oauth/google/callback&` +
        `scope=https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${store.id}`
      
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600')
      
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { authCode } = event.data
          createSheetWithAuthCode(authCode)
          window.removeEventListener('message', messageListener)
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          alert('Error en la autenticación de Google')
          setIsCreatingSheet(false)
          window.removeEventListener('message', messageListener)
        }
      }
      
      window.addEventListener('message', messageListener)
      
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setIsCreatingSheet(false)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error creando hoja:', error)
      alert('Error al crear la hoja')
      setIsCreatingSheet(false)
    }
  }

  const createSheetWithAuthCode = async (authCode: string) => {
    if (!store) return
    
    try {
      const response = await createGoogleSheet(store.id, authCode)
      
      if (response.success && response.data) {
        setSheetInfo(response.data)
        alert(`✅ Hoja creada correctamente!\n\nPuedes editarla aquí: ${response.data.editUrl}`)
        await loadProducts(store.id)
      } else {
        alert(`Error: ${response.error || 'No se pudo crear la hoja'}`)
      }
    } catch (error) {
      console.error('Error creando hoja:', error)
      alert('Error al crear la hoja')
    } finally {
      setIsCreatingSheet(false)
    }
  }

  const handleSyncFromGoogleSheets = async () => {
    if (!store) return
    
    setIsSyncing(true)
    try {
      const response = await syncProductsFromSheets(store.id)
      
      if (response.success) {
        await loadProducts(store.id)
        await loadSheetInfo(store.id)
        
        alert(`✅ Se sincronizaron ${response.data?.count || 0} productos desde Google Sheets\n\nLos cambios ya están disponibles en la tienda pública.`)
      } else {
        alert(`Error: ${response.error || 'No se pudo sincronizar'}`)
      }
    } catch (error) {
      console.error('Error sincronizando:', error)
      alert('Error al sincronizar desde Google Sheets')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!store) return
    
    setIsCreatingBackup(true)
    try {
      const response = await createSheetBackup(store.id)
      
      if (response.success && response.data) {
        alert(`✅ Backup creado correctamente!\n\nURL: ${response.data.backupUrl}`)
      } else {
        alert(`Error: ${response.error || 'No se pudo crear el backup'}`)
      }
    } catch (error) {
      console.error('Error creando backup:', error)
      alert('Error al crear el backup')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleSaveGoogleSheetsConfig = async () => {
    if (!store) return
    
    try {
      await updateStoreConfig(store.id, {
        googleSheetsUrl: googleSheetsUrl
      })
      alert("✅ Configuración guardada correctamente")
      setIsConfigOpen(false)
    } catch (error) {
      console.error('Error guardando configuración:', error)
      alert('Error al guardar la configuración')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminAuthGate user={user} onLogin={handleLogin} />
  }

  const categories = categoriesList
  const sections = [
    { id: "destacados", name: "Destacados", description: "Nuestros platos más populares", order: 1 },
    { id: "menu-principal", name: "Menú Principal", order: 2 }
  ]

  return (
    <div className="min-h-screen bg-background">
      <StoreAdminHeader 
        storeName={store?.config.name || ""} 
        storeSlug={resolvedParams.storeSlug} 
        onLogout={handleLogout} 
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <StoreStatsCards 
          totalProducts={products.length}
          availableProducts={products.filter((p) => p.available).length}
          featuredProducts={products.filter((p) => p.featured).length}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                  Gestiona el catálogo de productos de tu tienda. 
                  {sheetInfo ? " Los cambios se sincronizan con Google Sheets." : " Configura Google Sheets para sincronización automática."}
                </CardDescription>
              </div>
              <ProductsActions
                hasSheetInfo={!!sheetInfo}
                isSyncing={isSyncing}
                isCreatingSheet={isCreatingSheet}
                isCreatingBackup={isCreatingBackup}
                lastSynced={sheetInfo?.lastSynced}
                sheetEditUrl={sheetInfo?.editUrl}
                onCreateGoogleSheet={handleCreateGoogleSheet}
                onSyncFromSheets={handleSyncFromGoogleSheets}
                onCreateBackup={handleCreateBackup}
                onOpenSheet={() => sheetInfo && window.open(sheetInfo.editUrl, '_blank')}
                onConfigLegacy={() => setIsConfigOpen(true)}
                onDownloadTemplate={handleDownloadTemplate}
                onImportCSV={handleImportCSV}
                onCreateProduct={handleCreateProduct}
                productsCount={products.length}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ProductsTable
              products={products}
              formatPrice={formatPrice}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
          </CardContent>
        </Card>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Modifica los datos del producto"
                : "Completa los datos del nuevo producto"}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct || undefined}
            categories={categories}
            sections={sections}
            onSubmit={handleSubmitProduct}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingProduct(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <ImportConfirmationDialog
        open={isImportConfirmOpen}
        onOpenChange={setIsImportConfirmOpen}
        pendingImportData={pendingImportData}
        onConfirm={handleConfirmImport}
      />

      <GoogleSheetsConfigDialog
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        googleSheetsUrl={googleSheetsUrl}
        onUrlChange={setGoogleSheetsUrl}
        onSave={handleSaveGoogleSheetsConfig}
      />
    </div>
  )
}

