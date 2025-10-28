"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function OrderSentPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Pedido enviado</CardTitle>
          <CardDescription>Tu pedido ha sido enviado por WhatsApp correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold">Próximos pasos:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Confirma tu pedido en WhatsApp</li>
              <li>Espera la confirmación del restaurante</li>
              <li>Te avisaremos cuando esté listo</li>
            </ol>
          </div>

          <Link href="/" className="block">
            <Button className="w-full" size="lg">
              Volver al inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
