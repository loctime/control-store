# 🍽️ Mi Restaurante - Pedidos Online

Aplicación web moderna de pedidos online para restaurantes, construida con Next.js 14, React 19 y TypeScript.

## ✨ Características

- 🛒 **Sistema de Carrito** - Gestión completa de pedidos
- 📱 **Diseño Responsive** - Optimizado para móvil, tablet y desktop
- 🎨 **UI Moderna** - Componentes con TailwindCSS
- 🔐 **Panel Administrativo** - Gestión de productos y pedidos
- 💬 **Integración WhatsApp** - Envío directo de pedidos
- ⚡ **Rendimiento Optimizado** - Next.js 14 con App Router

## 🚀 Instalación

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Construir para producción
pnpm build

# Iniciar en producción
pnpm start
```

## 🌐 Despliegue en Vercel

La forma más fácil de desplegar tu aplicación Next.js es usar [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

O manualmente:

1. **Conecta tu repositorio** a Vercel
2. **Configura las variables de entorno** si las necesitas
3. **Deploy** - Vercel detectará automáticamente Next.js y configurará todo

### Variables de Entorno

Si necesitas configurar variables de entorno en Vercel:

- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Añade las variables necesarias

## 📂 Estructura del Proyecto

```
├── app/              # Páginas y rutas (App Router)
│   ├── admin/       # Panel administrativo
│   ├── carrito/     # Carrito de compras
│   └── checkout/    # Proceso de pago
├── components/       # Componentes reutilizables
│   ├── admin/       # Componentes del admin
│   └── ui/          # Componentes UI base
├── lib/             # Utilidades y lógica
│   ├── store.ts     # Estado global (Zustand)
│   ├── types.ts     # Tipos TypeScript
│   └── data-loader.ts
└── public/          # Archivos estáticos
```

## 🛠️ Tecnologías

- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos
- **Zustand** - State Management
- **Lucide React** - Iconos

## 📝 Licencia

Este proyecto es privado.

## 👨‍💻 Desarrollo

Para contribuir o modificar el proyecto:

1. Clona el repositorio
2. Instala las dependencias
3. Crea una rama para tus cambios
4. Realiza tus modificaciones
5. Envía un pull request

---

Desarrollado con ❤️ para optimizar el servicio de pedidos online.

