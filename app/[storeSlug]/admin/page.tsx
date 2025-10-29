"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth"
import { getStoreBySlug, isUserOwnerOfStore, getProductsCollection } from "@/lib/stores"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product, Store } from "@/lib/types"
import { ProductForm } from "@/components/admin/product-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, LogOut, Store as StoreIcon, Shield } from "lucide-react"

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
              <Button onClick={handleCreateProduct}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo producto
              </Button>
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

