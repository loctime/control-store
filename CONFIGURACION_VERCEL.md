# 🔧 Configuración de Variables de Entorno en Vercel

## ⚠️ Importante: Variables de Entorno Requeridas

Tu aplicación requiere las siguientes variables de entorno de Firebase. Debes configurarlas en Vercel antes de hacer el deploy.

## 🚀 Configuración en Vercel

### Paso 1: Obtener las credenciales de Firebase

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. En la sección **Tus aplicaciones**, busca tu app web
5. Copia los valores de configuración

### Paso 2: Configurar en Vercel

1. Ve a tu proyecto en [Vercel](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables (CON el prefijo `NEXT_PUBLIC_`):

```bash
NEXT_PUBLIC_REBASE_API_KEY=AIza...
NEXT_PUBLIC_REBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_REBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_REBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_REBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_REBASE_APP_ID=1:123456789:web:abc123
```

### Paso 3: Re-deploy

Después de configurar las variables:
1. Ve a la pestaña **Deployments**
2. Haz clic en los tres puntos (...) del último deployment
3. Selecciona **Redeploy**
4. Marca la casilla **Use existing Build Cache**
5. Haz clic en **Redeploy**

## 📝 Notas Importantes

- ⚠️ **NUNCA** agregues archivos `.env` al repositorio público
- ✅ Todas las variables que empiecen con `NEXT_PUBLIC_` son accesibles desde el cliente
- 🔒 Firebase es necesario para:
  - Autenticación de usuarios
  - Base de datos Firestore
  - Sistema de invitaciones

## 🔍 Verificación

Una vez configurado, deberías poder:
- Acceder a `/admin/dashboard` sin errores
- Crear links de invitación
- Autenticarse con Google
- Crear tiendas nuevas

## 🐛 Solución de Problemas

### Error `auth/invalid-api-key`:
1. Verifica que todas las variables estén configuradas en Vercel
2. Verifica que tengan el prefijo `NEXT_PUBLIC_`
3. Verifica que no tengan espacios extra al inicio/final
4. Haz un nuevo deploy después de agregar las variables

### Error `location is not defined`:
- ✅ Esto ya está corregido en el código (protección de `window`)

### Error `revalidate is on the client`:
- ✅ Corregido: Se eliminaron las exportaciones de `revalidate` de páginas cliente

### Advertencia sobre middleware:
- ⚠️ El middleware está deprecado en Next.js 16
- Es solo una advertencia, no afecta el funcionamiento
- Puedes ignorarla por ahora o actualizar a la nueva convención en el futuro

## 📚 Documentación Adicional

- [Configuración de variables de entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase - Agregar Firebase a tu app web](https://firebase.google.com/docs/web/setup)

