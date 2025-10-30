# 🔧 Configuración de Variables de Entorno

## ❌ **Problema Actual**
El botón "Crear hoja en Google Drive" falla con error `invalid_client` porque falta la configuración de Google OAuth.

## ✅ **Solución**

### **1. Crear archivo `.env.local`**

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Firebase Configuration (usar las mismas credenciales que ControlFile)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Google OAuth Configuration (REQUERIDO para Google Sheets)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui

# Backend API (REQUERIDO para Google Sheets)
NEXT_PUBLIC_BACKEND_URL=https://controlfile.onrender.com
```

### **2. Obtener Google OAuth Credentials**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a "APIs y servicios" > "Credenciales"
4. Crea una credencial OAuth 2.0
5. Configura los dominios autorizados:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.com` (producción)
6. Copia el `Client ID` y `Client Secret`

### **3. Configurar Redirect URI**

En Google Cloud Console, agrega esta URL de redirección:
```
http://localhost:3000/api/oauth/google/callback
```

### **4. Reiniciar el servidor**

Después de crear el archivo `.env.local`:
```bash
npm run dev
# o
pnpm dev
```

## 🔍 **Verificación**

Una vez configurado, el botón "Crear hoja en Google Drive" debería:
1. Abrir una ventana de Google OAuth
2. Permitir autorizar la aplicación
3. Crear la hoja de Google Sheets
4. Mostrar el enlace de edición

## 📝 **Notas Importantes**

- El archivo `.env.local` NO debe subirse a Git
- Las variables `NEXT_PUBLIC_*` son visibles en el navegador
- `GOOGLE_CLIENT_SECRET` solo se usa en el servidor
- Si usas Vercel, configura estas variables en el dashboard de Vercel
