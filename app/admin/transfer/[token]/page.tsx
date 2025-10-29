"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTransferByToken, completeTransfer } from "@/lib/stores"
import { signInWithEmailAndPassword } from "firebase/auth"
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

  // Handle params as Promise or object
  const resolvedParams = use(Promise.resolve(params))

  useEffect(() => {
    if (resolvedParams?.token) {
      loadTransferData()
    } else {
      setError("Token de transferencia no encontrado en la URL")
      setIsLoading(false)
    }
  }, [resolvedParams?.token])

  const loadTransferData = async () => {
    try {
      setIsLoading(true)
      
      if (!resolvedParams?.token) {
        setError("Token de transferencia no válido")
        return
      }
      
      const transferData = await getTransferByToken(resolvedParams.token)
      
      if (!transferData) {
        setError("Link de transferencia no válido o expirado")
        return
      }

      if (transferData.used) {
        setError("Este link de transferencia ya ha sido utilizado")
        return
      }

      setTransfer(transferData)
      setStore(transferData.store)
    } catch (error) {
      console.error("Error cargando transferencia:", error)
      setError("Error cargando datos de transferencia")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsTransferring(true)

    try {
      // Autenticar al nuevo dueño
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const newOwnerId = userCredential.user.uid
      const newOwnerEmail = userCredential.user.email

      if (!newOwnerEmail) {
        throw new Error("No se pudo obtener el email del usuario")
      }

      // Completar la transferencia
      if (!resolvedParams?.token) {
        throw new Error("Token de transferencia no válido")
      }
      await completeTransfer(resolvedParams.token, newOwnerEmail, newOwnerId)

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

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isTransferring}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando transferencia...
                </>
              ) : (
                "Aceptar transferencia"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Al aceptar, recibirás todos los productos, configuraciones y acceso a Google Sheets de esta tienda.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
