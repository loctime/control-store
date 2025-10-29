"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getInvitationByToken, markInvitationAsUsed, createStore, generateSlug, isSlugAvailable, ensureUserDocument, addStoreToUser } from "@/lib/stores"
import { Store, Loader2, CheckCircle } from "lucide-react"

export default function SignupPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [user] = useAuthState(auth)
  
  const [invitation, setInvitation] = useState<any>(null)
  const [storeName, setStoreName] = useState("")
  const [slug, setSlug] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    validateInvitation()
  }, [token])

  useEffect(() => {
    if (storeName) {
      const generatedSlug = generateSlug(storeName)
      setSlug(generatedSlug)
    }
  }, [storeName])

  async function validateInvitation() {
    try {
      const inv = await getInvitationByToken(token)
      if (!inv) {
        setError("Link de invitación inválido")
        return
      }
      if (inv.used) {
        setError("Este link ya fue utilizado")
        return
      }
      const now = new Date()
      const expiryDate = inv.expiresAt?.toDate?.() || new Date(inv.expiresAt)
      if (now > expiryDate) {
        setError("Este link ha expirado")
        return
      }
      setInvitation(inv)
      setStoreName(inv.storeName || "")
    } catch (error) {
      console.error("Error validando invitación:", error)
      setError("Error al validar el link")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      // El usuario ahora está autenticado
    } catch (error: any) {
      console.error("Error con Google:", error)
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Debes completar el inicio de sesión con Google")
      } else {
        setError("Error al iniciar sesión con Google")
      }
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
      setEmailAlreadyHasStore(false)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  async function handleCreateStore() {
    try {
      if (!user) {
        setError("Debes iniciar sesión primero")
        return
      }

      if (!storeName.trim()) {
        setError("Ingresa un nombre para tu tienda")
        return
      }

      if (!slug.trim()) {
        setError("El slug es requerido")
        return
      }

      // Verificar disponibilidad del slug
      const available = await isSlugAvailable(slug)
      if (!available) {
        setError("Ya existe una tienda con ese nombre. Prueba con otro.")
        return
      }

      setIsCreating(true)
      setError("")

      // 1. Crear o actualizar documento de usuario
      await ensureUserDocument(user.uid, user.email || "", user.displayName || undefined)

      // 2. Crear la tienda
      const storeId = await createStore({
        slug,
        name: storeName,
        ownerEmail: user.email || "",
        ownerId: user.uid,
        config: {
          name: storeName,
          phone: "",
          address: "",
          deliveryFee: 500,
          minOrderAmount: 2000,
          openingHours: "Lun-Dom 11:00 - 23:00",
        },
      })

      // 3. Asociar tienda al usuario
      await addStoreToUser(user.uid, storeId)

      // 4. Marcar invitación como usada
      await markInvitationAsUsed(token, user.email || "", user.uid)

      // Crear carpeta principal en ControlFile (si existe)
      try {
        const mainFolder = {
          id: `store-${storeId}-main`,
          userId: user.uid,
          name: storeName,
          type: 'folder',
          parentId: null,
          metadata: {
            source: 'taskbar',
            icon: 'Taskbar',
            color: 'text-blue-600',
            storeId: storeId,
          },
        }
        // Intentar crear la carpeta en la colección compartida de files
        await setDoc(doc(db, 'files', mainFolder.id), mainFolder)
      } catch (error) {
        console.warn("No se pudo crear carpeta en ControlFile:", error)
        // No es crítico si falla
      }

      setSuccess(true)
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push(`/${slug}`)
      }, 2000)
    } catch (error) {
      console.error("Error creando tienda:", error)
      setError("Error al crear la tienda")
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-green-600">¡Tienda creada!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Tu tienda <strong>{storeName}</strong> ha sido creada exitosamente.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Redirigiendo...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Crea tu tienda online</CardTitle>
          <CardDescription>
            Registrate con Google y personaliza tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!user ? (
            <div className="space-y-2">
              <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Iniciar sesión con Google
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                * Puedes crear múltiples tiendas con el mismo email
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Sesión iniciada como:</p>
                <p className="font-semibold">{user.email}</p>
                <Button 
                  onClick={handleSignOut} 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                >
                  Cerrar sesión
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de tu tienda</Label>
                <Input
                  id="storeName"
                  placeholder="Ej: Pizzas Don Juan"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              {slug && (
                <div className="space-y-2">
                  <Label htmlFor="slug">URL de tu tienda</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">tu-dominio.com/</span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateStore}
                disabled={isCreating || !storeName.trim() || !slug.trim()}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando tienda...
                  </>
                ) : (
                  "Crear mi tienda"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

