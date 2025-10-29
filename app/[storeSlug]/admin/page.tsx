"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth"
import { getStoreBySlug, isUserOwnerOfStore, getProductsCollection } from "@/lib/stores"
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
import { Plus, Edit, Trash2, LogOut, Store as StoreIcon, Shield, Download, Upload } from "lucide-react"

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
      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      console.error("Error eliminando producto:", error)
      alert("Error al eliminar el producto")
    }
  }

  const handleSubmitProduct = async (productData: Omit<Product, "id"> & { id?: string }) => {
    if (!store) return

    try {
      const productsRef = getProductsCollection(store.id)
      
      if (productData.id && editingProduct) {
        // Actualizar producto existente
        const productRef = doc(db, 'apps', 'control-store', 'stores', store.id, 'products', productData.id)
        await updateDoc(productRef, productData as any)
        setProducts(products.map(p => p.id === productData.id ? { ...productData, id: productData.id } as Product : p))
      } else {
        // Crear nuevo producto
        const { id, ...dataWithoutId } = productData
        const docRef = await addDoc(productsRef, dataWithoutId)
        const newProduct = { ...dataWithoutId, id: docRef.id } as Product
        setProducts([...products, newProduct])
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
      'Imagen'
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
          'Imagen': p.image || ''
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
          'Imagen': ''
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
          'Imagen': ''
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
                product.category = strValue || 'pizzas'
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

        // Agregar productos a Firestore
        const productsRef = getProductsCollection(store.id)
        let added = 0
        for (const productData of productsToImport) {
          try {
            await addDoc(productsRef, productData)
            added++
          } catch (error) {
            console.error('Error agregando producto:', error)
          }
        }

        alert(`Se importaron ${added} productos correctamente`)
        await loadProducts(store.id)
      } catch (error) {
        console.error('Error importando Excel:', error)
        alert('Error al importar el archivo Excel')
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
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

  // Categorías y secciones
  const categories = [
    { id: "pizzas", name: "Pizzas", icon: "pizza", order: 1 },
    { id: "empanadas", name: "Empanadas", icon: "utensils", order: 2 },
    { id: "bebidas", name: "Bebidas", icon: "glass-water", order: 3 },
    { id: "postres", name: "Postres", icon: "cake", order: 4 }
  ]

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
              <Button variant="outline" onClick={() => router.push(`/${resolvedParams.storeSlug}`)}>
                Ver tienda
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
                <CardDescription>Gestiona el catálogo de productos de tu tienda</CardDescription>
              </div>
              <div className="flex gap-2">
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
                            {categories.find((c) => c.id === product.category)?.name || product.category}
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
    </div>
  )
}

