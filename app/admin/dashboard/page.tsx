"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { isAuthenticated, logout, getCurrentUser, onAuthChange } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductForm } from "@/components/admin/product-form"
import { InvitationLinkGenerator } from "@/components/admin/invitation-link-generator"
import { StoresList } from "@/components/admin/stores-list"
import { ProductsTable } from "@/components/admin/products-table"
import { StoreStatsCards } from "@/components/admin/store-stats-cards"
import type { Product } from "@/lib/types"
import { Plus, LogOut, Store, Users, Palette, Building2 } from "lucide-react"
import { loadProductsFromJSON } from "@/lib/data-loader"
import { getAllStores } from "@/lib/stores"

export default function AdminDashboard() {
  const router = useRouter()
  const {
    products,
    categories,
    sections,
    setProducts,
    setCategories,
    setSections,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stores, setStores] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = () => {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser()
        console.log("Usuario autenticado:", currentUser)
        if (currentUser) {
          setUser(currentUser)
          checkUserRole(currentUser)
        } else {
          router.push("/admin")
        }
      } else {
        console.log("No hay usuario autenticado, redirigiendo...")
        router.push("/admin")
      }
    }

    // Verificar inmediatamente
    checkAuth()

    // También escuchar cambios de Firebase Auth si está disponible
    const unsubscribe = onAuthChange((user) => {
      console.log("Auth state changed:", user)
      if (user) {
        setUser(user)
        checkUserRole(user)
      } else {
        console.log("No hay usuario autenticado, redirigiendo...")
        router.push("/admin")
      }
    })

    return () => unsubscribe()
  }, [router])

  const checkUserRole = async (user: any) => {
    try {
      // Verificar que el email sea maxdev@gmail.com
      if (user?.email === "maxdev@gmail.com") {
        loadData()
      } else {
        console.log("Usuario no autorizado:", user?.email)
        router.push("/admin")
      }
    } catch (error) {
      console.error("Error verificando rol:", error)
      router.push("/admin")
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    const data = await loadProductsFromJSON()
    setProducts(data.products)
    setCategories(data.categories)
    setSections(data.sections)
    
    // Cargar tiendas
    try {
      const storesData = await getAllStores()
      setStores(storesData)
    } catch (error) {
      console.error("Error cargando tiendas:", error)
    }
    
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin")
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      deleteProduct(id)
    }
  }

  const handleSubmitProduct = (productData: Omit<Product, "id"> & { id?: string }) => {
    if (productData.id) {
      updateProduct(productData.id, productData)
    } else {
      addProduct({ ...productData, id: `product-${Date.now()}` } as Product)
    }
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-muted-foreground">Gestión de productos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/admin/customization')}>
                <Palette className="w-4 h-4 mr-2" />
                Personalizar
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
        <Tabs defaultValue="invitations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invitaciones
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Tiendas
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Productos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="space-y-4">
            <InvitationLinkGenerator />
          </TabsContent>

          <TabsContent value="stores" className="space-y-4">
            <StoresList onStoreUpdate={loadData} />
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Productos</CardTitle>
                    <CardDescription>Gestiona el catálogo de productos</CardDescription>
                  </div>
                  <Button onClick={handleCreateProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo producto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ProductsTable
                  products={products}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <StoreStatsCards
          totalStores={stores.length}
          totalProducts={products.length}
          availableProducts={products.filter((p) => p.available).length}
          featuredProducts={products.filter((p) => p.featured).length}
        />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica los datos del producto" : "Completa los datos del nuevo producto"}
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
