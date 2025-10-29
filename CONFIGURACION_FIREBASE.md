# 🔥 Configuración de Firebase

## ❌ Error Encontrado

El código tenía variables con el nombre incorrecto: `NEXT_PUBLIC_REBASE_*` (era un error de tipeo).

## ✅ Solución

Ahora el código acepta **ambos nombres**:
- `NEXT_PUBLIC_FIREBASE_*` (correcto)
- `NEXT_PUBLIC_REBASE_*` (compatibilidad temporal)

## 📝 Variables que Debes Tener

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Variables de Firebase (compartidas con ControlFile)
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key-aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id

# Backend URL (opcional para ControlFile)
BACKEND_URL=https://controlfile.tu-url.com
```

## 🔍 ¿Dónde Obtener Estos Valores?

1. Ve a Firebase Console: https://console.firebase.google.com
2. Selecciona tu proyecto (el que compartes con ControlFile)
3. Settings
4. Copia los valores de "SDK de configuración"

## 🚀 Después de Configurar

1. **Reinicia el servidor** (detén con Ctrl+C y vuelve a iniciar)
2. **Actualiza la página** en el navegador
3. **Intenta generar un link** de nuevo

---

**Nota**: Estas son las **mismas credenciales** que usan las otras apps de ControlFile.

