"use client"

import { use, useMemo } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import { useProductForm } from "@/hooks/use-product-form"
import { useExcelImport, useExcelExport } from "@/hooks/use-excel"
import { useGoogleSheets } from "@/hooks/use-google-sheets"
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
import type { Product } from "@/lib/types"

export default function StoreAdminPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const resolvedParams = use(params)
  
  // Hook de autenticación
  const { user, store, isAuthenticated, isLoading, handleLogin, handleLogout } = 
    useAdminAuth(resolvedParams.storeSlug)
  
  // Hook de productos
  const { products, loadProducts } = useProducts(store?.id)
  
  // Hook de categorías
  const { categories, loadCategories, syncFromProducts } = useCategories(store?.id)
  
  // Hook de formulario
  const productForm = useProductForm(
    store?.id,
    loadProducts,
    (updatedCategories) => {
      if (updatedCategories.length > 0) {
        loadCategories()
      }
    }
  )
  
  // Hook de Excel
  const excelImport = useExcelImport(
    products,
    store?.id,
    loadProducts,
    syncFromProducts
  )
  
  const excelExport = useExcelExport(products, resolvedParams.storeSlug)
  
  // Hook de Google Sheets
  const sheets = useGoogleSheets(store?.id, store?.config.name, loadProducts)
  
  // Memoize cálculos
  const stats = useMemo(() => ({
    total: products.length,
    available: products.filter(p => p.available).length,
    featured: products.filter(p => p.featured).length
  }), [products])

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
          totalProducts={stats.total}
          availableProducts={stats.available}
          featuredProducts={stats.featured}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                  Gestiona el catálogo de productos de tu tienda. 
                  {sheets.sheetInfo ? " Los cambios se sincronizan con Google Sheets." : " Configura Google Sheets para sincronización automática."}
                </CardDescription>
              </div>
              
              <ProductsActions
                hasSheetInfo={!!sheets.sheetInfo}
                isSyncing={sheets.isSyncing}
                isCreatingSheet={sheets.isCreatingSheet}
                isCreatingBackup={sheets.isCreatingBackup}
                lastSynced={sheets.sheetInfo?.lastSynced}
                sheetEditUrl={sheets.sheetInfo?.editUrl}
                onCreateGoogleSheet={sheets.handleCreateSheet}
                onSyncFromSheets={sheets.handleSync}
                onCreateBackup={sheets.handleCreateBackup}
                onOpenSheet={() => sheets.sheetInfo && window.open(sheets.sheetInfo.editUrl, '_blank')}
                onConfigLegacy={() => sheets.setIsConfigOpen(true)}
                onDownloadTemplate={excelExport.handleDownload}
                onImportCSV={excelImport.handleImport}
                onCreateProduct={productForm.handleCreateProduct}
                productsCount={products.length}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <ProductsTable
              products={products}
              onEdit={productForm.handleEditProduct}
              onDelete={async (productId: string) => {
                if (!confirm("¿Estás seguro de eliminar este producto?")) return
                // TODO: Usar servicio de productos
                await loadProducts()
                await syncFromProducts(products.filter(p => p.id !== productId))
              }}
            />
          </CardContent>
        </Card>
      </main>

      {/* Dialog de formulario de producto */}
      <Dialog open={productForm.isDialogOpen} onOpenChange={(open) => !open && productForm.closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {productForm.editingProduct ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>
              {productForm.editingProduct
                ? "Modifica los datos del producto"
                : "Completa los datos del nuevo producto"}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={productForm.editingProduct || undefined}
            categories={categories}
            sections={sections}
            onSubmit={productForm.handleSubmitProduct}
            onCancel={productForm.closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de importación */}
      <ImportConfirmationDialog
        open={excelImport.isConfirmOpen}
        onOpenChange={excelImport.setIsConfirmOpen}
        pendingImportData={excelImport.pendingData}
        onConfirm={excelImport.handleConfirm}
      />

      {/* Dialog de configuración de Google Sheets */}
      <GoogleSheetsConfigDialog
        open={sheets.isConfigOpen}
        onOpenChange={sheets.setIsConfigOpen}
        googleSheetsUrl={sheets.googleSheetsUrl}
        onUrlChange={sheets.setGoogleSheetsUrl}
        onSave={sheets.handleSaveConfig}
      />
    </div>
  )
}

