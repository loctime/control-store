"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, TrendingDown, TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, Upload } from "lucide-react"

interface ImportConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingImportData: {
    totalCurrent: number
    totalNew: number
    toDelete: number
    toAdd: number
    toEdit: number
    deleteList: string[]
    addList: string[]
  } | null
  onConfirm: () => void
}

export function ImportConfirmationDialog({
  open,
  onOpenChange,
  pendingImportData,
  onConfirm
}: ImportConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-primary" />
            Confirmar Importación de Productos
          </DialogTitle>
          <DialogDescription>
            Revisa los cambios que se realizarán en tu catálogo de productos
          </DialogDescription>
        </DialogHeader>

        {pendingImportData && (
          <div className="space-y-4">
            {/* Estadísticas principales */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-sm font-medium text-red-700">Se Eliminarán</CardTitle>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{pendingImportData.toDelete}</p>
                  <p className="text-xs text-red-500">productos actuales</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-sm font-medium text-green-700">Se Agregarán</CardTitle>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{pendingImportData.toAdd}</p>
                  <p className="text-xs text-green-500">productos nuevos</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-sm font-medium text-blue-700">Se Actualizarán</CardTitle>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{pendingImportData.toEdit}</p>
                  <p className="text-xs text-blue-500">productos modificados</p>
                </CardContent>
              </Card>
            </div>

            {/* Resumen */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong className="text-foreground">Total actual:</strong> {pendingImportData.totalCurrent} productos
              </p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Total después:</strong> {pendingImportData.totalNew} productos
              </p>
            </div>

            {/* Lista de productos a eliminar */}
            {pendingImportData.toDelete > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Productos que se eliminarán (primeros 5):
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {pendingImportData.deleteList.map((name: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {name}
                      </li>
                    ))}
                    {pendingImportData.toDelete > 5 && (
                      <li className="text-xs text-muted-foreground italic">
                        ...y {pendingImportData.toDelete - 5} más
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Lista de productos nuevos */}
            {pendingImportData.toAdd > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Productos nuevos (primeros 5):
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {pendingImportData.addList.map((name: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {name}
                      </li>
                    ))}
                    {pendingImportData.toAdd > 5 && (
                      <li className="text-xs text-muted-foreground italic">
                        ...y {pendingImportData.toAdd - 5} más
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Advertencia */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Esta acción reemplazará todos tus productos actuales
                    </p>
                    <p className="text-xs text-amber-700">
                      Asegúrate de haber exportado un respaldo si deseas conservar los productos actuales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <Upload className="w-4 h-4" />
            Confirmar Importación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

