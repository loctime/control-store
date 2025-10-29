"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTransferByToken, completeTransfer } from "@/lib/stores"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TransferPageProps {
  params: {
    token: string
  }
}

export default function TransferPage({ params }: TransferPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transfer, setTransfer] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [token, setToken] = useState<string>("")

  // Type assertion for auth
  const firebaseAuth = auth as Auth

  // Handle params - it might be a Promise in Next.js 15+
  useEffect(() => {
    const getToken = async () => {
      try {
        // Resolve params if it's a Promise (in Next.js 15+ params can be a Promise)
        const resolvedParams = await (params as unknown as Promise<{ token: string }>)
        
        if (resolvedParams && resolvedParams.token) {
          setToken(resolvedParams.token)
        }
      } catch (error) {
        console.error("Error getting token:", error)
      }
    }
    getToken()
  }, [params])

  useEffect(() => {
    // Only try to load if we have a token
    if (!token) {
      return
    }

    // Load transfer data when token is available
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        const transferData = await getTransferByToken(token)
        
        if (!transferData) {
          setError("Link de transferencia no válido o expirado")
          setIsLoading(false)
          return
        }

        if (transferData.used) {
          setError("Este link de transferencia ya ha sido utilizado")
          setIsLoading(false)
          return
        }

        setTransfer(transferData)
        setStore(transferData.store)
        setIsLoading(false)
      } catch (error) {
        console.error("Error cargando transferencia:", error)
        setError("Error cargando datos de transferencia")
        setIsLoading(false)
      }
    }

    loadData()
  }, [token])

  const handleGoogleTransfer = async () => {
    setError("")
    setIsTransferring(true)

    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(firebaseAuth, provider)
      const newOwnerId = userCredential.user.uid
      const newOwnerEmail = userCredential.user.email

      if (!newOwnerEmail) {
        throw new Error("No se pudo obtener el email del usuario")
      }

      // Completar la transferencia
      if (!token) {
        throw new Error("Token de transferencia no válido")
      }
      await completeTransfer(token, newOwnerEmail, newOwnerId)

      toast({
        title: "Transferencia exitosa",
        description: `La tienda "${store?.name}" ha sido transferida a ${newOwnerEmail}`,
      })

      // Redirigir al dashboard del nuevo dueño
      router.push(`/${store?.slug}/admin`)
    } catch (error: any) {
      console.error("Error en transferencia:", error)
      setError(error.message || "Error durante la transferencia")
    } finally {
      setIsTransferring(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsTransferring(true)

    try {
      // Autenticar al nuevo dueño
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const newOwnerId = userCredential.user.uid
      const newOwnerEmail = userCredential.user.email

      if (!newOwnerEmail) {
        throw new Error("No se pudo obtener el email del usuario")
      }

      // Completar la transferencia
      if (!token) {
        throw new Error("Token de transferencia no válido")
      }
      await completeTransfer(token, newOwnerEmail, newOwnerId)

      toast({
        title: "Transferencia exitosa",
        description: `La tienda "${store?.name}" ha sido transferida a ${newOwnerEmail}`,
      })

      // Redirigir al dashboard del nuevo dueño
      router.push(`/${store?.slug}/admin`)
    } catch (error: any) {
      console.error("Error en transferencia:", error)
      setError(error.message || "Error durante la transferencia")
    } finally {
      setIsTransferring(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Cargando transferencia...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error en la transferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push("/admin")} 
              className="w-full mt-4"
              variant="outline"
            >
              Volver al panel de administración
            </Button>
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
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Transferir Tienda</CardTitle>
          <CardDescription>
            Recibirás la tienda "{store?.name}" con toda su configuración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Información de la tienda</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Nombre:</strong> {store?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>URL:</strong> {store?.slug}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Google Sheets:</strong> Incluido en la transferencia
              </p>
            </div>
          </div>

          {!showEmailPassword ? (
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleTransfer}
                className="w-full" 
                size="lg"
                disabled={isTransferring}
                variant="default"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando transferencia...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              <Button 
                onClick={() => setShowEmailPassword(true)}
                className="w-full" 
                variant="outline"
                disabled={isTransferring}
              >
                Email y contraseña
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Tu email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Tu contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={() => setShowEmailPassword(false)}
                  className="w-full" 
                  variant="outline"
                  disabled={isTransferring}
                >
                  Volver
                </Button>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isTransferring}
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Aceptar transferencia"
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Al aceptar, recibirás todos los productos, configuraciones y acceso a Google Sheets de esta tienda.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
