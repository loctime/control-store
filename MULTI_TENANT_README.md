# 🏪 Sistema Multi-Tenant de Tiendas - Guía Rápida

## ✅ ¿Qué se implementó?

Sistema de **tiendas múltiples con URLs personalizadas** usando subdirectorios:

- **URL por tienda**: `tu-dominio.com/nombre-tienda`
- **Registro con Google Auth**
- **Links de invitación únicos** (expiran en 7 días)
- **Panel admin** para generar links
- **Integración con ControlFile**

## 🚀 Estructura de Rutas

```
/                           → Landing page
/admin                      → Login de administración
/admin/dashboard            → Panel admin (generar links)
/admin/signup/[token]       → Registro de cliente con link
/[storeSlug]                → Tienda pública del cliente
/[storeSlug]/carrito        → Carrito de esa tienda
/[storeSlug]/checkout       → Checkout de esa tienda
/[storeSlug]/pedido-enviado → Confirmación de pedido
```

## 📋 Cómo Funciona

### 1. **Admin genera link de invitación**
1. Ir a `/admin/dashboard`
2. Tab "Invitaciones"
3. Ingresar nombre sugerido para la tienda
4. Generar link
5. Copiar y enviar al cliente

### 2. **Cliente se registra**
1. Cliente abre el link único
2. Click "Iniciar sesión con Google"
3. Ingresa nombre de tienda
4. Sistema genera slug automático (URL friendly)
5. Confirma y su tienda queda creada

### 3. **URL de la tienda**
- Nombre: "Pizzas Don Juan"
- Slug generado: "pizzas-don-juan"
- URL final: `tu-dominio.com/pizzas-don-juan`

## 🔥 Estructura en Firestore (Compartida con ControlFile)

### Estructura Organizacional
```
apps/
└── control-store/
    ├── stores/           (colección de tiendas)
    │   └── {storeId}/
    │       ├── datos de la tienda
    │       └── products/ (subcolección de productos)
    │           └── {productId}
    └── invitations/      (colección de invitaciones)
        └── {invitationId}
```

### Colección: `apps/control-store/stores`
```typescript
{
  id: "store_abc123",
  slug: "pizzas-don-juan",
  name: "Pizzas Don Juan",
  ownerEmail: "juan@gmail.com",
  ownerId: "firebase-user-id",
  config: { ... },
  createdAt: timestamp
}
```

### Colección: `apps/control-store/invitations`
```typescript
{
  id: "inv_xyz789",
  token: "link-secreto-123",
  storeName: "Nueva Tienda",
  used: false,
  expiresAt: timestamp
}
```

### Subcolección: `apps/control-store/stores/{storeId}/products`
```typescript
{
  id: "prod_123",
  name: "Pizza Muzzarella",
  price: 4500,
  // ... resto de campos
}
```

### Colección Compartida: `files` (para ControlFile)
```typescript
// Carpeta de tienda en ControlFile taskbar
{
  id: "store-abc123-main",
  userId: "firebase-user-id",
  name: "Pizzas Don Juan",
  type: "folder",
  parentId: null,
  metadata: {
    source: "taskbar",
    icon: "Taskbar",
    color: "text-blue-600",
    storeId: "abc123"
  }
}
```

## 📝 Variables de Entorno Requeridas

Asegúrate de tener estas variables en `.env.local`:

```env
NEXT_PUBLIC_REBASE_API_KEY=tu-key
NEXT_PUBLIC_REBASE_AUTH_DOMAIN=tu-domain
NEXT_PUBLIC_REBASE_PROJECT_ID=tu-project
NEXT_PUBLIC_REBASE_STORAGE_BUCKET=tu-bucket
NEXT_PUBLIC_REBASE_MESSAGING_SENDER_ID=tu-id
NEXT_PUBLIC_REBASE_APP_ID=tu-app-id
BACKEND_URL=https://controlfile.tu-url.com
```

**Nota:** Estas son las mismas credenciales que usan las otras apps de ControlFile.

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Invitaciones
- Links únicos generados automáticamente
- Expiración en 7 días
- Uso único (se marca como usado al registrar)
- Validación de expiración

### ✅ Registro con Google
- Autenticación con Firebase Auth
- Creación automática de tienda
- Generación de slug desde nombre
- Validación de slugs disponibles
- Integración con ControlFile (crea carpeta en taskbar)

### ✅ Rutas Dinámicas
- Página de tienda pública
- Carrito por tienda
- Checkout por tienda
- Confirmación de pedido
- Links internos actualizados automáticamente

### ✅ Panel de Administración
- Generar links de invitación
- Ver lista de productos
- Crear/editar/eliminar productos

## 🔒 Seguridad

- ✅ Links de invitación con tokens únicos
- ✅ Validación de expiración
- ✅ Verificación de uso único
- ✅ Firebase Auth compartido con ControlFile
- ✅ Un solo email = una sola tienda
- ✅ Verificación de email duplicado
- ✅ Aislamiento de datos por app (control-store)
- ✅ Estructura organizada en `apps/control-store`

## 🎨 Personalización

Cada tienda puede personalizar:
- Nombre de la tienda
- URL (slug)
- Configuración de delivery
- Productos y catálogo
- Contacto

## 📦 Archivos Creados

```
lib/
├── firebase.ts                 → Config de Firebase
├── stores.ts                   → CRUD de tiendas e invitaciones
└── types.ts                    → Tipos actualizados

app/
├── [storeSlug]/               → Rutas dinámicas de tiendas
│   ├── page.tsx               → Tienda pública
│   ├── layout.tsx             → Layout de tienda
│   ├── carrito/page.tsx       → Carrito
│   ├── checkout/page.tsx      → Checkout
│   └── pedido-enviado/page.tsx → Confirmación
├── admin/
│   └── signup/
│       └── [token]/page.tsx   → Página de registro

components/
└── admin/
    └── invitation-link-generator.tsx → Generador de links

middleware.ts                   → Middleware de validación
```

## 🚀 Próximos Pasos

1. **Agregar productos** a las tiendas desde el panel admin
2. **Personalizar configuración** de cada tienda
3. **Subir imágenes** de productos (ControlFile)
4. **Configurar contacto** WhatsApp

## 💡 Tips

- El sistema genera slugs automáticamente desde el nombre
- Si un slug ya existe, el usuario puede modificarlo
- Los links expiran automáticamente después de 7 días
- **Cada email solo puede tener UNA tienda** (validación automática)
- Si un usuario ya tiene una tienda, se redirige automáticamente
- Los productos se guardan por tienda (subcolección)
- **Estructura compartida** con otras apps: `apps/control-store/`
- Compatible con Firebase Auth de ControlFile

---

¡Sistema Multi-Tenant listo y funcionando! 🎉

