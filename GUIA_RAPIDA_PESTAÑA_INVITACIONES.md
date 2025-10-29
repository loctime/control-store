# 🔍 Cómo ver la pestaña "Invitaciones"

## ✅ Solución Rápida

1. **Detén el servidor** (Ctrl+C en la terminal)

2. **Elimina la caché** de Next.js:
```bash
rm -rf .next
# O en Windows PowerShell:
Remove-Item -Recurse -Force .next
```

3. **Reinicia el servidor**:
```bash
pnpm dev
```

4. **Abre el navegador** y ve a:
```
http://localhost:3000/admin/dashboard
```

5. **Verás dos pestañas**:
   - ✅ **Invitaciones** (icono de usuarios) - Para generar links
   - ✅ **Productos** (icono de tienda) - Para gestionar productos

## 📍 Ubicación de la pestaña

La pestaña "Invitaciones" debería aparecer en la parte superior del panel, junto con la pestaña "Productos".

### Si NO ves la pestaña:

1. **Abre la consola del navegador** (F12)
2. **Revisa si hay errores** en rojo
3. **Haz un hard refresh**: Ctrl+Shift+R (o Cmd+Shift+R en Mac)

### Si SIGUE sin aparecer:

El código está correcto. El archivo `app/admin/dashboard/page.tsx` tiene:
```tsx
<TabsList>
  <TabsTrigger value="invitations" className="flex items-center gap-2">
    <Users className="w-4 h-4" />
    Invitaciones
  </TabsTrigger>
  <TabsTrigger value="products" className="flex items-center gap-2">
    <Store className="w-4 h-4" />
    Productos
  </TabsTrigger>
</TabsList>

<TabsContent value="invitations" className="space-y-4">
  <InvitationLinkGenerator />
</TabsContent>
```

## 🎯 Flujo Completo

1. Vas a `/admin/dashboard`
2. Ves la pestaña **"Invitaciones"** seleccionada por defecto
3. Ingresas un nombre (ej: "Pizzas Don Juan")
4. Haces clic en "Generar link"
5. Copias el link generado
6. Lo envías a tu cliente

---

**El servidor debería estar corriendo ahora. Actualiza la página (Ctrl+R) y deberías ver la pestaña "Invitaciones" 🎉**
