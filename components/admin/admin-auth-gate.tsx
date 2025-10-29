"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

interface AdminAuthGateProps {
  user: any
  onLogin: () => void
}

export function AdminAuthGate({ user, onLogin }: AdminAuthGateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <CardTitle className="text-2xl">Panel de Administración</CardTitle>
          <CardDescription>
            {user ? "No tienes permisos para acceder a esta tienda" : "Inicia sesión para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <Button onClick={onLogin} className="w-full" size="lg">
              Iniciar sesión con Google
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Sesión iniciada como: {user.email}
              </p>
              <Button onClick={onLogin} className="w-full" variant="outline">
                Cambiar de cuenta
              </Button>
            </div>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Solo el dueño de la tienda puede acceder a este panel
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

