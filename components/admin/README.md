# Componentes de Administración Reutilizables

Este directorio contiene componentes reutilizables para el panel de administración de tiendas.

## 📋 Índice

- [Componentes UI](#componentes-ui)
- [Hooks Personalizados](#hooks-personalizados)
- [Uso y Ejemplos](#uso-y-ejemplos)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🎨 Componentes UI

### 1. `StoreAdminHeader`

**Descripción:** Header del panel de administración con logo, nombre de la tienda y botones de navegación.

**Props:**
```typescript
interface StoreAdminHeaderProps {
  storeName: string      // Nombre de la tienda
  storeSlug: string      // Slug de la tienda (para links)
  onLogout: () => void   // Callback para cerrar sesión
}
```

**Ejemplo de uso:**
```tsx
<StoreAdminHeader 
  storeName="Mi Tienda" 
  storeSlug="mi-tienda" 
  onLogout={handleLogout} 
/>
```

---

### 2. `StoreStatsCards`

**Descripción:** Tarjetas que muestran estadísticas resumidas (total de productos, disponibles, destacados).

**Props:**
```typescript
interface StoreStatsCardsProps {
  totalProducts: number      // Total de productos
  availableProducts: number  // Productos disponibles
  featuredProducts: number   // Productos destacados
}
```

**Ejemplo de uso:**
```tsx
<StoreStatsCards 
  totalProducts={50}
  availableProducts={45}
  featuredProducts={10}
/>
```

---

### 3. `ProductsTable`

**Descripción:** Tabla que muestra la lista de productos con opciones de editar y eliminar.

**Props:**
```typescript
interface ProductsTableProps {
  products: Product[]                              // Array de productos
  formatPrice: (price: number) => string          // Función para formatear precios
  onEdit: (product: Product) => void              // Callback al editar
  onDelete: (productId: string) => void           // Callback al eliminar
}
```

**Ejemplo de uso:**
```tsx
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price)
}

<ProductsTable
  products={products}
  formatPrice={formatPrice}
  onEdit={handleEditProduct}
  onDelete={handleDeleteProduct}
/>
```

---

### 4. `ProductsActions`

**Descripción:** Barra de botones de acción para la gestión de productos (sincronización, importación, exportación, etc.).

**Props:**
```typescript
interface ProductsActionsProps {
  hasSheetInfo: boolean              // Si hay hoja de Google Sheets configurada
  isSyncing: boolean                 // Estado de sincronización
  isCreatingSheet: boolean           // Estado de creación de hoja
  isCreatingBackup: boolean          // Estado de creación de backup
  lastSynced?: Date | null           // Fecha de última sincronización
  sheetEditUrl?: string              // URL de edición de la hoja
  onCreateGoogleSheet: () => void    // Callback para crear hoja
  onSyncFromSheets: () => void       // Callback para sincronizar
  onCreateBackup: () => void         // Callback para crear backup
  onOpenSheet: () => void            // Callback para abrir hoja
  onConfigLegacy: () => void         // Callback para config legacy
  onDownloadTemplate: () => void     // Callback para descargar plantilla
  onImportCSV: () => void            // Callback para importar
  onCreateProduct: () => void        // Callback para crear producto
  productsCount: number              // Cantidad de productos
}
```

**Ejemplo de uso:**
```tsx
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
```

---

### 5. `ImportConfirmationDialog`

**Descripción:** Diálogo modal que muestra un resumen antes de confirmar la importación de productos desde Excel.

**Props:**
```typescript
interface ImportConfirmationDialogProps {
  open: boolean                                    // Controla visibilidad del diálogo
  onOpenChange: (open: boolean) => void           // Callback para cerrar/abrir
  pendingImportData: {                            // Datos de la importación pendiente
    totalCurrent: number                          // Total actual de productos
    totalNew: number                              // Total después de importación
    toDelete: number                              // Productos a eliminar
    toAdd: number                                 // Productos nuevos
    toEdit: number                                // Productos a actualizar
    deleteList: string[]                          // Lista de nombres a eliminar
    addList: string[]                             // Lista de nombres nuevos
  } | null
  onConfirm: () => void                           // Callback de confirmación
}
```

**Ejemplo de uso:**
```tsx
<ImportConfirmationDialog
  open={isImportConfirmOpen}
  onOpenChange={setIsImportConfirmOpen}
  pendingImportData={pendingImportData}
  onConfirm={handleConfirmImport}
/>
```

---

### 6. `GoogleSheetsConfigDialog`

**Descripción:** Diálogo para configurar la URL de Google Sheets (modo legacy).

**Props:**
```typescript
interface GoogleSheetsConfigDialogProps {
  open: boolean                        // Controla visibilidad
  onOpenChange: (open: boolean) => void
  googleSheetsUrl: string              // URL actual
  onUrlChange: (url: string) => void   // Callback al cambiar URL
  onSave: () => void                   // Callback para guardar
}
```

**Ejemplo de uso:**
```tsx
<GoogleSheetsConfigDialog
  open={isConfigOpen}
  onOpenChange={setIsConfigOpen}
  googleSheetsUrl={googleSheetsUrl}
  onUrlChange={setGoogleSheetsUrl}
  onSave={handleSaveGoogleSheetsConfig}
/>
```

---

### 7. `AdminAuthGate`

**Descripción:** Componente que muestra la pantalla de login/autenticación para el panel de administración.

**Props:**
```typescript
interface AdminAuthGateProps {
  user: any           // Objeto del usuario actual (o null)
  onLogin: () => void // Callback para iniciar sesión
}
```

**Ejemplo de uso:**
```tsx
if (!isAuthenticated) {
  return <AdminAuthGate user={user} onLogin={handleLogin} />
}
```

---

## 🪝 Hooks Personalizados

### 1. `useProducts`

**Ubicación:** `hooks/use-products.ts`

**Descripción:** Hook que gestiona las operaciones CRUD de productos.

**Retorna:**
```typescript
{
  products: Product[]              // Lista de productos
  isLoading: boolean               // Estado de carga
  loadProducts: () => Promise<void>          // Cargar productos
  createProduct: (productData: Omit<Product, "id">) => Promise<Product>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}
```

**Ejemplo de uso:**
```tsx
const { products, loadProducts, createProduct, updateProduct, deleteProduct } = useProducts(storeId)

// Cargar productos
await loadProducts()

// Crear producto
const newProduct = await createProduct(productData)

// Actualizar producto
await updateProduct(productId, { name: "Nuevo nombre" })

// Eliminar producto
await deleteProduct(productId)
```

---

### 2. `useGoogleSheets`

**Ubicación:** `hooks/use-google-sheets.ts`

**Descripción:** Hook que gestiona las operaciones con Google Sheets (sincronización, creación de backups, etc.).

**Retorna:**
```typescript
{
  sheetInfo: any                                                  // Información de la hoja
  isSyncing: boolean                                              // Estado de sincronización
  isCreatingSheet: boolean                                        // Estado de creación
  isCreatingBackup: boolean                                       // Estado de backup
  loadSheetInfo: (storeId: string) => Promise<void>              // Cargar info
  syncFromSheets: (storeId: string) => Promise<ApiResponse>      // Sincronizar
  createBackup: (storeId: string) => Promise<ApiResponse>        // Crear backup
  setIsCreatingSheet: (value: boolean) => void                   // Setter
}
```

**Ejemplo de uso:**
```tsx
const { sheetInfo, loadSheetInfo, syncFromSheets, createBackup } = useGoogleSheets()

// Cargar información
await loadSheetInfo(storeId)

// Sincronizar
const response = await syncFromSheets(storeId)

// Crear backup
const backupResponse = await createBackup(storeId)
```

---

## 📖 Uso y Ejemplos

### Ejemplo Completo: Panel de Administración

```tsx
import { StoreAdminHeader } from "@/components/admin/store-admin-header"
import { StoreStatsCards } from "@/components/admin/store-stats-cards"
import { ProductsTable } from "@/components/admin/products-table"
import { ProductsActions } from "@/components/admin/products-actions"
import { AdminAuthGate } from "@/components/admin/admin-auth-gate"
import { ImportConfirmationDialog } from "@/components/admin/import-confirmation-dialog"
import { GoogleSheetsConfigDialog } from "@/components/admin/google-sheets-config-dialog"

export default function StoreAdminPage() {
  // ... estados y funciones

  if (!isAuthenticated) {
    return <AdminAuthGate user={user} onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreAdminHeader 
        storeName={store?.config.name || ""} 
        storeSlug={slug} 
        onLogout={handleLogout} 
      />

      <main>
        <StoreStatsCards 
          totalProducts={products.length}
          availableProducts={products.filter(p => p.available).length}
          featuredProducts={products.filter(p => p.featured).length}
        />

        <ProductsActions
          // ... props
        />

        <ProductsTable
          products={products}
          formatPrice={formatPrice}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      </main>

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
```

---

## ✅ Mejores Prácticas

### 1. **Props Desacopladas**
Cada componente recibe solo las props necesarias, sin depender de la estructura interna de otros componentes.

### 2. **Separación de Responsabilidades**
- **UI Components:** Solo renderizan y llaman callbacks
- **Hooks:** Gestionan la lógica y estado
- **Page Component:** Orquesta la interacción entre componentes

### 3. **Reutilización**
Estos componentes pueden ser usados en otras páginas de administración:
- Dashboard principal
- Páginas de tiendas múltiples
- Paneles de usuario

### 4. **Mantenimiento**
- Cada componente tiene un propósito claro
- Fácil de testear individualmente
- Modificaciones localizadas (no afectan otros componentes)

### 5. **Extensibilidad**
Para agregar nuevas funcionalidades:
- Nuevo componente → Nuevo archivo
- Nuevo hook → Nuevo archivo en `hooks/`
- Sin tocar el archivo principal

---

## 🔄 Antes vs Después

### Antes (Monolítico)
```tsx
// ❌ Todo en un archivo de 1263 líneas
export default function StoreAdminPage() {
  // Estados (30+ líneas)
  // Funciones (1000+ líneas)
  // JSX con todo mezclado (200+ líneas)
}
```

### Después (Componentizado)
```tsx
// ✅ 766 líneas organizadas
export default function StoreAdminPage() {
  // Solo orquestación
  return (
    <>
      <StoreAdminHeader />
      <StoreStatsCards />
      <ProductsTable />
      <ProductsActions />
      {/* etc */}
    </>
  )
}
```

---

## 📝 Notas

- Todos los componentes usan TypeScript con interfaces bien definidas
- Compatible con `shadcn/ui` components
- Estilizado con Tailwind CSS
- Optimizado para responsive design
- Accesible (ARIA labels donde corresponde)

---

## 🚀 Próximos Pasos

1. Extraer más lógica a hooks personalizados
2. Crear más componentes específicos (filtros, búsqueda, etc.)
3. Agregar tests unitarios para cada componente
4. Documentar con Storybook
5. Optimizar renders con `React.memo` donde sea necesario

