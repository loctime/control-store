# Plan de Refactorización en Etapas

## 📊 Estado Actual

- **Archivo principal:** 766 líneas
- **Componentes creados:** 7 componentes UI
- **Hooks creados:** 2 hooks personalizados

## 🎯 Objetivo: Reducir a ~300 líneas

## 📝 Etapas Propuestas

### Etapa 1: Extraer Lógica de Importación/Exportación ✅ (Parcialmente hecho)

**Actual:** La lógica de Excel está en el componente principal (~200 líneas)

**Propuesta:**
```typescript
// hooks/use-excel.ts
export function useExcelImport() {
  const parseVariants = (variantsStr: string): ProductVariant[] => { /* ... */ }
  const parseRow = (row: any) => { /* ... */ }
  const analyzeChanges = (current: Product[], imports: any[]) => { /* ... */ }
  
  return { parseVariants, parseRow, analyzeChanges }
}

export function useExcelExport() {
  const serializeVariants = (groups: any[]) => { /* ... */ }
  const generateHeaders = () => { /* ... */ }
  const exportToExcel = (products: Product[]) => { /* ... */ }
  
  return { serializeVariants, generateHeaders, exportToExcel }
}
```

### Etapa 2: Extraer Lógica de Google Sheets ✅ (Parcialmente hecho)

**Ya existe:** `hooks/use-google-sheets.ts`

**Mejoras propuestas:**
- Mover la lógica de OAuth popup al hook
- Mover la creación de hoja con auth code al hook

### Etapa 3: Crear Custom Hooks para Estado del Formulario

**Actual:** Estado del formulario disperso en el componente principal

**Propuesta:**
```typescript
// hooks/use-product-form.ts
export function useProductForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const handleCreateProduct = () => { /* ... */ }
  const handleEditProduct = (product: Product) => { /* ... */ }
  const handleSubmitProduct = async (data: any) => { /* ... */ }
  
  return {
    isDialogOpen,
    editingProduct,
    handleCreateProduct,
    handleEditProduct,
    handleSubmitProduct,
    closeDialog: () => setIsDialogOpen(false)
  }
}
```

### Etapa 4: Extraer Lógica de Sincronización de Categorías

**Actual:** Llamadas a `syncCategoriesFromProducts` dispersas

**Propuesta:**
```typescript
// hooks/use-categories.ts
export function useCategories(storeId: string) {
  const [categories, setCategories] = useState<any[]>([])
  
  const syncFromProducts = async (products: Product[]) => {
    await syncCategoriesFromProducts(storeId, products)
    const updated = await getStoreCategories(storeId)
    setCategories(updated)
  }
  
  return { categories, syncFromProducts }
}
```

### Etapa 5: Crear Hook para Autenticación

**Actual:** Lógica de autenticación y verificación de acceso en el componente

**Propuesta:**
```typescript
// hooks/use-admin-auth.ts
export function useAdminAuth(storeSlug: string) {
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const checkStoreAccess = async (userId: string) => { /* ... */ }
  const handleLogin = async () => { /* ... */ }
  const handleLogout = async () => { /* ... */ }
  
  return { user, store, isAuthenticated, isLoading, handleLogin, handleLogout }
}
```

### Etapa 6: Separar Lógica de Negocio en Servicios

**Propuesta:**
```typescript
// services/product-service.ts
export class ProductService {
  static async loadProducts(storeId: string): Promise<Product[]> { /* ... */ }
  static async createProduct(storeId: string, data: any): Promise<Product> { /* ... */ }
  static async updateProduct(storeId: string, id: string, data: any): Promise<void> { /* ... */ }
  static async deleteProduct(storeId: string, id: string): Promise<void> { /* ... */ }
  static async importProducts(storeId: string, products: any[]): Promise<void> { /* ... */ }
}

// services/category-service.ts
export class CategoryService {
  static async syncFromProducts(storeId: string, products: Product[]): Promise<void> { /* ... */ }
  static async getCategories(storeId: string): Promise<Category[]> { /* ... */ }
}

// services/sheet-service.ts
export class SheetService {
  static async getSheetInfo(storeId: string): Promise<any> { /* ... */ }
  static async syncFromSheets(storeId: string): Promise<any> { /* ... */ }
  static async createBackup(storeId: string): Promise<any> { /* ... */ }
}
```

### Etapa 7: Componente Principal Minimalista (Resultado Final)

Después de todas las etapas, el componente principal quedaría así:

```typescript
// app/[storeSlug]/admin/page.tsx (~150-200 líneas)
"use client"

import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useProductForm } from "@/hooks/use-product-form"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"
import { useExcelImport, useExcelExport } from "@/hooks/use-excel"
import { useGoogleSheets } from "@/hooks/use-google-sheets"

// ... todos los componentes UI

export default function StoreAdminPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const resolvedParams = use(params)
  
  // Hooks de autenticación y acceso
  const { user, store, isAuthenticated, isLoading, handleLogin, handleLogout } = 
    useAdminAuth(resolvedParams.storeSlug)
  
  // Hooks de productos
  const { products, loadProducts } = useProducts(store?.id || '')
  const { categories, syncFromProducts } = useCategories(store?.id || '')
  
  // Hooks de formulario
  const { isDialogOpen, editingProduct, handleCreate, handleEdit, handleSubmit, closeDialog } = 
    useProductForm(store?.id, () => loadProducts(), () => syncFromProducts(products))
  
  // Hooks de Excel
  const excelImport = useExcelImport(products, store?.id, () => loadProducts(), () => syncFromProducts(products))
  const excelExport = useExcelExport(products, resolvedParams.storeSlug)
  
  // Hook de Google Sheets
  const sheets = useGoogleSheets(store?.id, () => loadProducts())
  
  // Format functions
  const formatPrice = (price: number) => new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 0
  }).format(price)

  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <AdminAuthGate user={user} onLogin={handleLogin} />

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
          availableProducts={products.filter(p => p.available).length}
          featuredProducts={products.filter(p => p.featured).length}
        />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                  Gestiona el catálogo de productos de tu tienda.
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
                onCreateProduct={handleCreate}
                productsCount={products.length}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <ProductsTable
              products={products}
              formatPrice={formatPrice}
              onEdit={handleEdit}
              onDelete={ProductService.deleteProduct.bind(null, store?.id)}
            />
          </CardContent>
        </Card>
      </main>

      <ProductDialog
        open={isDialogOpen}
        onClose={closeDialog}
        product={editingProduct || undefined}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ImportConfirmationDialog
        open={excelImport.isConfirmOpen}
        onClose={excelImport.closeConfirm}
        data={excelImport.pendingData}
        onConfirm={excelImport.handleConfirm}
      />

      <GoogleSheetsConfigDialog
        open={sheets.isConfigOpen}
        onClose={() => sheets.setIsConfigOpen(false)}
        googleSheetsUrl={sheets.googleSheetsUrl}
        onUrlChange={sheets.setGoogleSheetsUrl}
        onSave={sheets.handleSaveConfig}
      />
    </div>
  )
}
```

## 📊 Comparación

| Aspecto | Antes | Actual | Objetivo |
|---------|-------|--------|----------|
| Líneas en page.tsx | 1263 | 766 | ~150-200 |
| Componentes UI | 0 | 7 | 7 |
| Hooks personalizados | 0 | 2 | 8-10 |
| Servicios | 0 | 0 | 3-4 |
| Mantenibilidad | ❌ Difícil | ✅ Mejor | ✅✅ Excelente |
| Testabilidad | ❌ Compleja | ✅ Mejor | ✅✅ Fácil |
| Reutilización | ❌ Ninguna | ✅ Parcial | ✅✅ Total |

## 🎯 Conclusión

Sí, 766 líneas sigue siendo mucho para un componente de página. La siguiente fase sería extraer toda la lógica de negocio a hooks y servicios, dejando el componente principal solo para orquestar componentes UI y llamar a funciones.

¿Quieres que implemente alguna de estas etapas ahora?

