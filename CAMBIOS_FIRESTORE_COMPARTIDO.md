# 🔄 Cambios en Firestore - Estructura Compartida

## 🎯 Resumen

Se actualizó el sistema para compartir Firestore con las apps de ControlFile, siguiendo la estructura organizacional estándar.

## 📂 Nueva Estructura

### Antes:
```
stores (raíz)
invitations (raíz)
products/{storeId} (raíz)
```

### Ahora:
```
apps/
└── control-store/
    ├── stores/
    │   └── {storeId}/
    │       └── products/
    └── invitations/
```

## 🔧 Cambios en el Código

### 1. `lib/stores.ts`

**Añadidas constantes:**
```typescript
const APP_ID = 'control-store'

const getStoresCollection = () => collection(db, 'apps', APP_ID, 'stores')
const getInvitationsCollection = () => collection(db, 'apps', APP_ID, 'invitations')
const getStoreDoc = (storeId: string) => doc(db, 'apps', APP_ID, 'stores', storeId)
```

**Todas las referencias actualizadas para usar la nueva ruta:**
- ✅ `createStore()` → `apps/control-store/stores`
- ✅ `getStoreBySlug()` → `apps/control-store/stores`
- ✅ `getStoreById()` → `apps/control-store/stores/{id}`
- ✅ `createInvitation()` → `apps/control-store/invitations`
- ✅ `getInvitationByToken()` → `apps/control-store/invitations`

**Nueva función:**
```typescript
getUserStoreByEmail(email: string)
```
- Verifica si un email ya tiene una tienda registrada
- Previne duplicados

### 2. `app/[storeSlug]/page.tsx`

**Actualizada carga de productos:**
```typescript
// Antes:
collection(db, 'stores', storeData.id, 'products')

// Ahora:
collection(db, 'apps', 'control-store', 'stores', storeData.id, 'products')
```

### 3. `app/admin/signup/[token]/page.tsx`

**Nuevas validaciones:**
- ✅ Detecta si el email ya tiene una tienda
- ✅ Muestra mensaje específico si ya existe
- ✅ Redirige automáticamente a la tienda existente
- ✅ Permite cerrar sesión si se equivocó de cuenta
- ✅ Manejo de errores mejorado

**Nuevo estado:**
```typescript
const [emailAlreadyHasStore, setEmailAlreadyHasStore] = useState(false)
```

**Validación automática:**
```typescript
useEffect(() => {
  async function checkExistingStore() {
    if (user?.email) {
      const existingStore = await getUserStoreByEmail(user.email)
      if (existingStore) {
        setEmailAlreadyHasStore(true)
        setTimeout(() => {
          router.push(`/${existingStore.slug}`)
        }, 3000)
      }
    }
  }
  checkExistingStore()
}, [user])
```

**Carpeta en ControlFile:**
```typescript
await setDoc(doc(db, 'files', mainFolder.id), mainFolder)
```
- Crea carpeta en la colección compartida `files`
- Aparece en el taskbar de ControlFile
- Try-catch para no fallar si ControlFile no existe

## 🔒 Seguridad Mejorada

### Validación de Email Único
- ✅ Un email = una sola tienda
- ✅ Verificación automática antes de crear
- ✅ Redirección si ya existe
- ✅ Opción de cerrar sesión

### Compatibilidad con Firebase Auth
- ✅ Usa las mismas credenciales que ControlFile
- ✅ No requiere configuración adicional
- ✅ Compatible con otras apps del ecosistema

## 🎨 Beneficios

### Para el Ecosistema
- ✅ **Organización**: Todas las apps en `apps/`
- ✅ **Escalabilidad**: Fácil agregar más apps
- ✅ **Mantenimiento**: Estructura clara y consistente
- ✅ **Colaboración**: Sin conflictos entre apps

### Para los Usuarios
- ✅ **Seguridad**: No pueden crear tiendas duplicadas
- ✅ **Experiencia**: Redirección automática si ya tienen tienda
- ✅ **Flexibilidad**: Pueden cerrar sesión y usar otra cuenta

### Para los Desarrolladores
- ✅ **Código limpio**: Funciones auxiliares reutilizables
- ✅ **Documentación**: README actualizado con estructura
- ✅ **Error handling**: Try-catch en operaciones críticas

## 📝 Migración de Datos

Si ya tienes datos en la estructura antigua:

1. **Backup** de las colecciones `stores` e `invitations`
2. **Crear** la estructura `apps/control-store`
3. **Migrar** los datos a las nuevas ubicaciones
4. **Actualizar** las reglas de seguridad de Firestore

### Script de Migración (ejemplo):
```javascript
// Migrar stores
const oldStores = await db.collection('stores').get()
const batch = db.batch()

oldStores.docs.forEach(doc => {
  const newRef = db.collection('apps/control-store/stores').doc(doc.id)
  batch.set(newRef, doc.data())
})

await batch.commit()
```

## 🚀 Próximos Pasos

1. ✅ Actualizar reglas de seguridad de Firestore
2. ⏳ Migrar datos existentes (si aplica)
3. ⏳ Probar flujo completo de registro
4. ⏳ Verificar integración con ControlFile

## ⚠️ Importante

- **No borres** las colecciones antiguas hasta verificar que todo funciona
- **Prueba** con un usuario de prueba primero
- **Backup** antes de cualquier migración
- Las **variables de entorno** siguen siendo las mismas

---

**Estructura compartida implementada correctamente! 🎉**

