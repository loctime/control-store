"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth"
import { getStoreBySlug, isUserOwnerOfStore, getProductsCollection, normalizeCategoryName, syncCategoriesFromProducts, getStoreCategories, updateStoreConfig } from "@/lib/stores"
import { createGoogleSheet, getProductsFromSheets, syncProductsFromSheets, createSheetBackup, getSheetInfo } from "@/lib/controlfile-api"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, Store, ProductVariant } from "@/lib/types"
import * as XLSX from 'xlsx'
import { ProductForm } from "@/components/admin/product-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, LogOut, Store as StoreIcon, Shield, Download, Upload, AlertTriangle, CheckCircle2, FileText, TrendingUp, TrendingDown, RefreshCw, Settings, Link } from "lucide-react"

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
  const [importPreview, setImportPreview] = useState<any>(null)
  const [pendingImportData, setPendingImportData] = useState<any>(null)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [sheetInfo, setSheetInfo] = useState<any>(null)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  useEffect(() => {
    // Verificar autenticación
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

      // Verificar si el usuario es dueño de la tienda
      const isOwner = await isUserOwnerOfStore(userId, resolvedParams.storeSlug)
      setIsAuthenticated(isOwner)

      if (isOwner) {
        await loadProducts(storeData.id)
        // Cargar categorías
        const categories = await getStoreCategories(storeData.id)
        if (categories.length > 0) {
          setCategoriesList(categories)
        } else {
          // Fallback a categorías por defecto
          setCategoriesList([
            { id: "pizzas", name: "Pizzas", icon: "pizza", order: 1 },
            { id: "empanadas", name: "Empanadas", icon: "utensils", order: 2 },
            { id: "bebidas", name: "Bebidas", icon: "glass-water", order: 3 },
            { id: "postres", name: "Postres", icon: "cake", order: 4 }
          ])
        }
        // Cargar URL de Google Sheets si existe
        if (storeData.config.googleSheetsUrl) {
          setGoogleSheetsUrl(storeData.config.googleSheetsUrl)
        }
        
        // Cargar información de la hoja configurada
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

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error en login:", error)
    }
  }

  const handleLogout = async () => {
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
      const productRef = doc(db, 'apps', 'control-store', 'stores', store.id, 'products', productId)
      await deleteDoc(productRef)
      const updatedProducts = products.filter(p => p.id !== productId)
      setProducts(updatedProducts)
      // Sincronizar categorías luego de eliminar un producto
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
      
      // Normalizar categoría antes de guardar
      const normalizedData = {
        ...productData,
        category: productData.category ? normalizeCategoryName(productData.category) : productData.category
      }
      
      if (normalizedData.id && editingProduct) {
        // Actualizar producto existente
        const productRef = doc(db, 'apps', 'control-store', 'stores', store.id, 'products', normalizedData.id)
        const { id, ...dataToUpdate } = normalizedData
        await updateDoc(productRef, dataToUpdate as any)
        setProducts(products.map(p => p.id === normalizedData.id ? { ...normalizedData } as Product : p))
      } else {
        // Crear nuevo producto
        const { id, ...dataWithoutId } = normalizedData
        const docRef = await addDoc(productsRef, dataWithoutId)
        const newProduct = { ...dataWithoutId, id: docRef.id } as Product
        setProducts([...products, newProduct])
      }
      
      // Sincronizar categorías después de guardar
      const allProducts = editingProduct 
        ? products.map(p => p.id === normalizedData.id ? { ...normalizedData } as Product : p)
        : [...products, { ...normalizedData, id: (normalizedData.id || '') } as Product]
      await syncCategoriesFromProducts(store.id, allProducts)
      
      // Recargar categorías actualizadas
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

  // Función para exportar variedades como string
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

  // Función para descargar plantilla Excel
  const handleDownloadTemplate = () => {
    const headers = [
      'Nombre', 
      'Descripcion', 
      'Variedades 1', 
      'Variedades 1 Titulo', 
      'Variedades 2', 
      'Variedades 2 Titulo',
      'Variedades 3',
      'Variedades 3 Titulo',
      'Variedades 4',
      'Variedades 4 Titulo',
      'Precio', 
      'Precio Anterior', 
      'Ocultar', 
      'Categoria', 
      'SubCategoria', 
      'Categoria Imagen de fondo', 
      'Categoria Icono', 
      'Controlar Stock',
      'Tamaño Imagen',
      'Imagen (URL)' // Solo se aceptan enlaces a imágenes, no imágenes embebidas
    ]
    
    // Datos para la plantilla/exportación
    let rows: any[] = []
    
    if (products.length > 0) {
      // Exportar productos existentes
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
    } else {
      // Ejemplos para plantilla
      rows = [
        {
          'Nombre': 'Pizza Muzzarella',
          'Descripcion': 'Pizza con queso muzzarella y salsa de tomate',
          'Variedades 1': 'Grande: 5000, Mediana: 4500, Chica: 3500',
          'Variedades 1 Titulo': 'Tamaño',
          'Variedades 2': '',
          'Variedades 2 Titulo': '',
          'Variedades 3': '',
          'Variedades 3 Titulo': '',
          'Variedades 4': '',
          'Variedades 4 Titulo': '',
          'Precio': 4500,
          'Precio Anterior': '',
          'Ocultar': 'No',
          'Categoria': 'pizzas',
          'SubCategoria': 'clasicas',
          'Categoria Imagen de fondo': '',
          'Categoria Icono': '',
          'Controlar Stock': 'No',
          'Tamaño Imagen': 'large',
          'Imagen (URL)': ''
        },
        {
          'Nombre': 'Pizza Napolitana',
          'Descripcion': 'Pizza con queso, tomate y albahaca',
          'Variedades 1': 'Grande: 5200, Mediana: 4800',
          'Variedades 1 Titulo': 'Tamaño',
          'Variedades 2': '',
          'Variedades 2 Titulo': '',
          'Variedades 3': '',
          'Variedades 3 Titulo': '',
          'Variedades 4': '',
          'Variedades 4 Titulo': '',
          'Precio': 4800,
          'Precio Anterior': '',
          'Ocultar': 'No',
          'Categoria': 'pizzas',
          'SubCategoria': 'clasicas',
          'Categoria Imagen de fondo': '',
          'Categoria Icono': '',
          'Controlar Stock': 'No',
          'Tamaño Imagen': 'large',
          'Imagen (URL)': ''
        }
      ]
    }

    // Crear workbook de Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers })
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')

    // Descargar archivo
    const filename = products.length > 0 
      ? `productos-${resolvedParams.storeSlug}-${new Date().toISOString().split('T')[0]}.xlsx`
      : `plantilla-productos.xlsx`
    
    XLSX.writeFile(wb, filename)
  }

  // Función para importar productos desde Excel
  const handleImportCSV = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsImporting(true)
      try {
        // Leer archivo Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet) as any[]

        // Solo procesar si tenemos la tienda
        if (!store) return

        // Función auxiliar para parsear variedades del formato "Nombre: Precio, Nombre2: Precio2"
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
        
        // Procesar cada fila del Excel
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
              case 'sección':
              case 'seccion':
                product.section = strValue || 'menu-principal'
                break
              case 'disponible':
                product.available = strValue.toLowerCase() === 'sí' || strValue.toLowerCase() === 'si' || strValue.toLowerCase() === 'yes' || strValue === '1'
                break
              case 'destacado':
                product.featured = strValue.toLowerCase() === 'sí' || strValue.toLowerCase() === 'si' || strValue.toLowerCase() === 'yes' || strValue === '1'
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
              // Procesar variedades
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

          // Validar que tenga nombre
          if (product.name) {
            productsToImport.push(product)
          }
        }

        // Analizar cambios
        const newProductNames = new Set(productsToImport.map(p => p.name.toLowerCase()))
        const currentProductNames = new Set(products.map(p => p.name.toLowerCase()))
        
        const toDelete = products.filter(p => !newProductNames.has(p.name.toLowerCase()))
        const toAdd = productsToImport.filter(p => !currentProductNames.has(p.name.toLowerCase()))
        const toEdit = productsToImport.filter(p => {
          const current = products.find(cp => cp.name.toLowerCase() === p.name.toLowerCase())
          if (!current) return false
          // Comparar propiedades clave
          return current.basePrice !== p.basePrice || 
                 current.description !== p.description ||
                 current.category !== p.category ||
                 current.available !== p.available ||
                 current.featured !== p.featured
        })

        // Guardar datos para confirmación
        setPendingImportData({
          productsToImport,
          totalCurrent: products.length,
          totalNew: productsToImport.length,
          toDelete: toDelete.length,
          toAdd: toAdd.length,
          toEdit: toEdit.length,
          deleteList: toDelete.slice(0, 5).map(p => p.name), // Primeros 5
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
      // Eliminar todos los productos actuales
      const productsRef = getProductsCollection(store.id)
      const currentSnapshot = await getDocs(productsRef)
      const deletePromises = currentSnapshot.docs.map(async (docSnap) => {
        await deleteDoc(doc(db, 'apps', 'control-store', 'stores', store.id, 'products', docSnap.id))
      })
      await Promise.all(deletePromises)

      // Agregar productos nuevos
      let added = 0
      for (const productData of pendingImportData.productsToImport) {
        try {
          await addDoc(productsRef, productData)
          added++
        } catch (error) {
          console.error('Error agregando producto:', error)
        }
      }

      // Sincronizar categorías desde los productos
      if (added > 0) {
        await syncCategoriesFromProducts(store.id, pendingImportData.productsToImport)
        // Recargar categorías actualizadas
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


  // Función para cargar información de la hoja
  const loadSheetInfo = async (storeId: string) => {
    try {
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

  // Función para crear hoja en Google Drive del cliente
  const handleCreateGoogleSheet = async () => {
    if (!store) return
    
    setIsCreatingSheet(true)
    try {
      // Abrir popup de OAuth de Google
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${origin}/api/oauth/google/callback&` +
        `scope=https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${store.id}`
      
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600')
      
      // Escuchar el mensaje del popup
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
      
      // Limpiar listener si se cierra el popup
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

  // Función para crear la hoja con el código de autorización
  const createSheetWithAuthCode = async (authCode: string) => {
    if (!store) return
    
    try {
      const response = await createGoogleSheet(store.id, authCode)
      
      if (response.success && response.data) {
        setSheetInfo(response.data)
        alert(`✅ Hoja creada correctamente!\n\nPuedes editarla aquí: ${response.data.editUrl}`)
        await loadProducts(store.id) // Recargar productos
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

  // Función para sincronizar desde Google Sheets (flujo híbrido)
  const handleSyncFromGoogleSheets = async () => {
    if (!store) return
    
    setIsSyncing(true)
    try {
      // 1. Sincronizar desde Google Sheets → Controlfile actualiza Firestore
      const response = await syncProductsFromSheets(store.id)
      
      if (response.success) {
        // 2. Recargar productos desde Firestore (ya actualizado por Controlfile)
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

  // Función para crear backup
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

  // Función para guardar configuración de Google Sheets (legacy)
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <CardDescription>
              {user ? "No tienes permisos para acceder a esta tienda" : "Inicia sesión para continuar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <Button onClick={handleLogin} className="w-full" size="lg">
                Iniciar sesión con Google
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  Sesión iniciada como: {user.email}
                </p>
                <Button onClick={handleLogin} className="w-full" variant="outline">
                  Cambiar de cuenta
                </Button>
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Solo el dueño de la tienda puede acceder a este panel
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Secciones
  const categories = categoriesList

  const sections = [
    { id: "destacados", name: "Destacados", description: "Nuestros platos más populares", order: 1 },
    { id: "menu-principal", name: "Menú Principal", order: 2 }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StoreIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-muted-foreground">{store?.config.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/${resolvedParams.storeSlug}`} target="_blank" rel="noopener noreferrer">
                  Ver tienda
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total productos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{products.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">
                {products.filter((p) => p.available).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Destacados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {products.filter((p) => p.featured).length}
              </p>
            </CardContent>
          </Card>
        </div>

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
              <div className="flex gap-2 flex-wrap">
                {/* Google Sheets - Nueva integración */}
                {!sheetInfo ? (
                  <Button variant="outline" onClick={handleCreateGoogleSheet} disabled={isCreatingSheet}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreatingSheet ? "Creando hoja..." : "Crear hoja en Google Drive"}
                  </Button>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleSyncFromGoogleSheets} disabled={isSyncing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar desde Google Sheets"}
                      </Button>
                      {sheetInfo.lastSynced && (
                        <span className="text-xs text-muted-foreground">
                          Última sync: {new Date(sheetInfo.lastSynced).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button variant="outline" onClick={handleCreateBackup} disabled={isCreatingBackup}>
                      <Download className="w-4 h-4 mr-2" />
                      {isCreatingBackup ? "Creando backup..." : "Crear backup"}
                    </Button>
                    <Button variant="outline" onClick={() => window.open(sheetInfo.editUrl, '_blank')}>
                      <Link className="w-4 h-4 mr-2" />
                      Abrir hoja
                    </Button>
                  </>
                )}
                
                {/* Configuración legacy */}
                <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración legacy
                </Button>
                
                {/* Excel import/export */}
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  {products.length > 0 ? 'Exportar Excel' : 'Descargar Plantilla'}
                </Button>
                <Button variant="outline" onClick={handleImportCSV} disabled={isImporting}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? "Importando..." : "Importar Excel"}
                </Button>
                <Button onClick={handleCreateProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo producto
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay productos. Crea uno nuevo para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(product.basePrice)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {product.available ? (
                              <Badge variant="default" className="bg-green-500">
                                Disponible
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No disponible</Badge>
                            )}
                            {product.featured && <Badge variant="default">Destacado</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

      {/* Modal de confirmación de importación */}
      <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6 text-primary" />
              Confirmar Importación de Productos
            </DialogTitle>
            <DialogDescription>
              Revisa los cambios que se realizarán en tu catálogo de productos
            </DialogDescription>
          </DialogHeader>

          {pendingImportData && (
            <div className="space-y-4">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <CardTitle className="text-sm font-medium text-red-700">Se Eliminarán</CardTitle>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{pendingImportData.toDelete}</p>
                    <p className="text-xs text-red-500">productos actuales</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-sm font-medium text-green-700">Se Agregarán</CardTitle>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{pendingImportData.toAdd}</p>
                    <p className="text-xs text-green-500">productos nuevos</p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-sm font-medium text-blue-700">Se Actualizarán</CardTitle>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{pendingImportData.toEdit}</p>
                    <p className="text-xs text-blue-500">productos modificados</p>
                  </CardContent>
                </Card>
              </div>

              {/* Resumen */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong className="text-foreground">Total actual:</strong> {pendingImportData.totalCurrent} productos
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Total después:</strong> {pendingImportData.totalNew} productos
                </p>
              </div>

              {/* Lista de productos a eliminar */}
              {pendingImportData.toDelete > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      Productos que se eliminarán (primeros 5):
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {pendingImportData.deleteList.map((name: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {name}
                        </li>
                      ))}
                      {pendingImportData.toDelete > 5 && (
                        <li className="text-xs text-muted-foreground italic">
                          ...y {pendingImportData.toDelete - 5} más
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Lista de productos nuevos */}
              {pendingImportData.toAdd > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Productos nuevos (primeros 5):
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {pendingImportData.addList.map((name: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {name}
                        </li>
                      ))}
                      {pendingImportData.toAdd > 5 && (
                        <li className="text-xs text-muted-foreground italic">
                          ...y {pendingImportData.toAdd - 5} más
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Advertencia */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        Esta acción reemplazará todos tus productos actuales
                      </p>
                      <p className="text-xs text-amber-700">
                        Asegúrate de haber exportado un respaldo si deseas conservar los productos actuales
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsImportConfirmOpen(false)
              setPendingImportData(null)
            }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmImport} className="gap-2">
              <Upload className="w-4 h-4" />
              Confirmar Importación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración de Google Sheets */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Link className="w-6 h-6 text-primary" />
              Configurar Google Sheets
            </DialogTitle>
            <DialogDescription>
              Conecta tu tienda con una hoja de Google Sheets para sincronización automática
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL de Google Sheets (CSV)</label>
              <input
                type="url"
                value={googleSheetsUrl}
                onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/[ID]/export?format=csv&gid=0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Para obtener esta URL: Comparte tu hoja como "Cualquier persona con el enlace puede ver" 
                y usa la URL de exportación CSV
              </p>
            </div>

            {googleSheetsUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Estructura requerida de la hoja:
                    </p>
                    <p className="text-xs text-blue-700">
                      Nombre | Descripción | Variedades 1 | Variedades 1 Título | ... | Categoría | Precio | Precio anterior | Imagen (URL)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Importante:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• La hoja debe ser pública (cualquier persona con el enlace puede ver)</li>
                    <li>• Usa la URL de exportación CSV, no la URL de edición</li>
                    <li>• La primera fila debe contener los encabezados de columnas</li>
                    <li>• Al sincronizar se reemplazarán todos los productos actuales</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoogleSheetsConfig}>
              Guardar Configuración
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

