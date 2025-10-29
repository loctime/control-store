# 🏪 Sistema Multi-Tenant de Tiendas

## 🎯 ¿Qué es?

Sistema SaaS que permite a los usuarios crear y gestionar múltiples tiendas online con URLs personalizadas.

**Ejemplo**: `tu-dominio.com/pizzas-don-juan`

## ✨ Características

- 🏪 **Múltiples tiendas por usuario** - Un email puede tener varias tiendas
- 🔗 **URLs personalizadas** - Cada tienda tiene su propia URL
- 📧 **Registro por invitación** - Links únicos que expiran en 7 días
- 🔐 **Google Auth** - Autenticación compartida con ControlFile
- 📱 **Responsive** - Funciona en móvil, tablet y desktop
- 💬 **WhatsApp** - Envío directo de pedidos
- 🎨 **Personalizable** - Cada tienda puede configurar su información

## 🚀 Flujo Rápido

### Para el Admin (crear tiendas)
1. Ir a `/admin/dashboard`
2. Tab "Invitaciones" → Generar link
3. Enviar link al cliente

### Para el Cliente (registrar tienda)
1. Abrir link de invitación
2. Login con Google
3. Ingresar nombre de tienda
4. ¡Listo! Su tienda: `tu-dominio.com/mi-tienda`

### Para los Clientes (comprar)
1. Visitar `tu-dominio.com/mi-tienda`
2. Agregar productos al carrito
3. Checkout → Enviar pedido por WhatsApp

## 📂 Estructura de Datos

```
Firestore (compartido con ControlFile)
├── apps/control-store/
│   ├── users/              # Usuarios del sistema
│   ├── stores/             # Tiendas
│   │   └── {storeId}/
│   │       └── products/   # Productos por tienda
│   └── invitations/        # Links de invitación
└── files/                  # ControlFile (carpetas en taskbar)
```

## 🔧 Configuración

### Variables de Entorno
```env
NEXT_PUBLIC_REBASE_API_KEY=tu-key
NEXT_PUBLIC_REBASE_AUTH_DOMAIN=tu-domain
NEXT_PUBLIC_REBASE_PROJECT_ID=tu-project
NEXT_PUBLIC_REBASE_STORAGE_BUCKET=tu-bucket
NEXT_PUBLIC_REBASE_MESSAGING_SENDER_ID=tu-id
NEXT_PUBLIC_REBASE_APP_ID=tu-app-id
BACKEND_URL=https://controlfile.tu-url.com
```

### Instalación
```bash
pnpm install
pnpm dev
```

## 📱 Rutas

```
/                           → Landing page
/admin                      → Login admin
/admin/dashboard            → Panel admin (generar links)
/admin/signup/[token]       → Registro con link único
/[storeSlug]                → Tienda pública
/[storeSlug]/carrito        → Carrito
/[storeSlug]/checkout       → Checkout
/[storeSlug]/pedido-enviado → Confirmación
```

## 🎨 Personalización

Cada tienda puede configurar:
- Nombre y descripción
- Información de contacto
- Costos de envío
- Horarios de atención
- Productos y precios
- Categorías y secciones

## 🔒 Seguridad

- Links de invitación únicos y con expiración
- Verificación de ownership por tienda
- Firebase Auth compartido
- Aislamiento de datos por tienda

## 📊 Escalabilidad

- Firestore escala automáticamente
- Vercel maneja el tráfico
- Un usuario puede tener múltiples tiendas
- Estructura organizada para crecimiento

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 19, TypeScript
- **UI**: TailwindCSS, Shadcn/ui
- **Estado**: Zustand
- **Base de datos**: Firestore
- **Auth**: Firebase Auth
- **Deploy**: Vercel

## 📚 Documentación

- [Documentación Completa](./DOCUMENTACION_COMPLETA.md)
- [Guía Rápida](./MULTI_TENANT_README.md)
- [Cambios Realizados](./FLUJO_CORREGIDO.md)

## 🚀 Despliegue

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

## 💡 Próximos Pasos

- [ ] Panel admin por tienda (`/[storeSlug]/admin`)
- [ ] Dashboard de usuario (`/mi-cuenta`)
- [ ] Estadísticas de ventas
- [ ] Integración con pagos

---

**¡Sistema listo para producción! 🎉**
