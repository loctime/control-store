"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, Plus } from "lucide-react"
import { createInvitation } from "@/lib/stores"

export function InvitationLinkGenerator() {
  const [storeName, setStoreName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerateLink() {
    if (!storeName.trim()) {
      setError("Ingresa un nombre para la tienda")
      return
    }

    setIsGenerating(true)
    setError("")
    setGeneratedLink(null)

    try {
      const token = await createInvitation(storeName)
      // Verificar que estamos en el navegador antes de usar window.location
      if (typeof window !== 'undefined') {
        const link = `${window.location.origin}/admin/signup/${token}`
        setGeneratedLink(link)
        setStoreName("")
      } else {
        setError("No se pudo determinar la URL")
      }
    } catch (error) {
      console.error("Error generando link:", error)
      setError("Error al generar el link de invitación")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopyLink() {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Generar link de invitación
        </CardTitle>
        <CardDescription>
          Crea un link único para que tus clientes se registren y creen su tienda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="storeName">Nombre sugerido para la tienda</Label>
          <Input
            id="storeName"
            placeholder="Ej: Pizzas Don Juan"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGenerateLink()
              }
            }}
          />
        </div>

        <Button
          onClick={handleGenerateLink}
          disabled={isGenerating || !storeName.trim()}
          className="w-full"
        >
          {isGenerating ? "Generando..." : "Generar link"}
        </Button>

        {generatedLink && (
          <div className="space-y-2 border rounded-lg p-4 bg-muted">
            <Label>Link de invitación generado</Label>
            <div className="flex gap-2">
              <Input value={generatedLink} readOnly className="font-mono text-sm" />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Este link expirará en 7 días y solo puede usarse una vez
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

