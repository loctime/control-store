# 🔌 **Integración con APIs Externas**

## 🎯 **Para Apps que NO Comparten Firestore con ControlFile**

**Si tu app NO comparte el mismo proyecto de Firestore que ControlFile, usa esta integración con APIs.**

## 🚀 **Ventajas:**

- **✅ Validaciones** - ControlFile maneja la lógica de negocio
- **✅ Seguridad** - Autenticación y permisos centralizados
- **✅ Consistencia** - Misma lógica para todas las apps
- **✅ Mantenimiento** - Actualizaciones centralizadas

## 📚 **Documentación Disponible:**

### 🚀 **Guías Principales:**
- **[Guía Carpetas Taskbar](./GUIA_CARPETAS_TASKBAR.md)** - Crear carpetas en taskbar
- **[Resumen Ejecutivo](./RESUMEN_CARPETAS_TASKBAR.md)** - Resumen rápido
- **[API Reference](./api-reference/)** - Documentación completa de APIs

### 🎯 **Funcionalidades:**
- **📁 Carpetas** - Crear en taskbar/navbar via API
- **📤 Archivos** - Subir y gestionar via API
- **🔗 Enlaces** - Compartir y descargar via API
- **🔍 Búsqueda** - Encontrar archivos via API
- **👥 Permisos** - Control de acceso via API

## 🚀 **Inicio Rápido:**

```typescript
// 1. Configurar URL del backend
const BACKEND_URL = 'https://controlfile.onrender.com';

// 2. Obtener token de autenticación
const token = await getAuth().currentUser?.getIdToken();

// 3. Crear carpeta en taskbar
const response = await fetch(`${BACKEND_URL}/api/folders/create`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: `miapp-main-${Date.now()}`,
    name: 'Mi App',
    parentId: null,
    source: 'taskbar', // ✅ Aparece en taskbar
    icon: 'Taskbar',
    color: 'text-blue-600',
    metadata: {
      isMainFolder: true,
      isPublic: false
    }
  }),
});

const result = await response.json();
console.log('✅ Carpeta creada:', result.folderId);
```

## 🎯 **Apps que Usan Esta Integración:**

- **Apps externas** - Que no comparten Firestore
- **Apps legacy** - Que ya usan APIs
- **Apps de terceros** - Que se integran con ControlFile

## ⚠️ **Consideraciones:**

- **Latencia** - API calls pueden ser más lentos
- **Dependencias** - Dependes del backend de ControlFile
- **Complejidad** - Más código y configuración
- **Mantenimiento** - Cambios en APIs pueden afectar tu app

---

# 🔌 **¡Integración con APIs Externas!**

