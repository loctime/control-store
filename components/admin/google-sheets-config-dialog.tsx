"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Link as LinkIcon, CheckCircle2, AlertTriangle } from "lucide-react"

interface GoogleSheetsConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  googleSheetsUrl: string
  onUrlChange: (url: string) => void
  onSave: () => void
}

export function GoogleSheetsConfigDialog({
  open,
  onOpenChange,
  googleSheetsUrl,
  onUrlChange,
  onSave
}: GoogleSheetsConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LinkIcon className="w-6 h-6 text-primary" />
            Configurar Google Sheets
          </DialogTitle>
          <DialogDescription>
            Conecta tu tienda con una hoja de Google Sheets para sincronización automática
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">URL de Google Sheets (CSV)</label>
            <input
              type="url"
              value={googleSheetsUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/[ID]/export?format=csv&gid=0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Para obtener esta URL: Comparte tu hoja como "Cualquier persona con el enlace puede ver" 
              y usa la URL de exportación CSV
            </p>
          </div>

          {googleSheetsUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Estructura requerida de la hoja:
                  </p>
                  <p className="text-xs text-blue-700">
                    Nombre | Descripción | Variedades 1 | Variedades 1 Título | ... | Categoría | Precio | Precio anterior | Imagen (URL)
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Importante:
                </p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• La hoja debe ser pública (cualquier persona con el enlace puede ver)</li>
                  <li>• Usa la URL de exportación CSV, no la URL de edición</li>
                  <li>• La primera fila debe contener los encabezados de columnas</li>
                  <li>• Al sincronizar se reemplazarán todos los productos actuales</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

