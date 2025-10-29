"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download, Upload, Settings, Link as LinkIcon, RefreshCw } from "lucide-react"

interface ProductsActionsProps {
  hasSheetInfo: boolean
  isSyncing: boolean
  isCreatingSheet: boolean
  isCreatingBackup: boolean
  lastSynced?: Date | null
  sheetEditUrl?: string
  onCreateGoogleSheet: () => void
  onSyncFromSheets: () => void
  onCreateBackup: () => void
  onOpenSheet: () => void
  onConfigLegacy: () => void
  onDownloadTemplate: () => void
  onImportCSV: () => void
  onCreateProduct: () => void
  productsCount: number
}

export function ProductsActions({
  hasSheetInfo,
  isSyncing,
  isCreatingSheet,
  isCreatingBackup,
  lastSynced,
  sheetEditUrl,
  onCreateGoogleSheet,
  onSyncFromSheets,
  onCreateBackup,
  onOpenSheet,
  onConfigLegacy,
  onDownloadTemplate,
  onImportCSV,
  onCreateProduct,
  productsCount
}: ProductsActionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {/* Google Sheets - Nueva integración */}
      {!hasSheetInfo ? (
        <Button variant="outline" onClick={onCreateGoogleSheet} disabled={isCreatingSheet}>
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingSheet ? "Creando hoja..." : "Crear hoja en Google Drive"}
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onSyncFromSheets} disabled={isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar desde Google Sheets"}
            </Button>
            {lastSynced && (
              <span className="text-xs text-muted-foreground">
                Última sync: {new Date(lastSynced).toLocaleString()}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={onCreateBackup} disabled={isCreatingBackup}>
            <Download className="w-4 h-4 mr-2" />
            {isCreatingBackup ? "Creando backup..." : "Crear backup"}
          </Button>
          <Button variant="outline" onClick={onOpenSheet}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Abrir hoja
          </Button>
        </>
      )}
      
      {/* Configuración legacy */}
      <Button variant="outline" onClick={onConfigLegacy}>
        <Settings className="w-4 h-4 mr-2" />
        Configuración legacy
      </Button>
      
      {/* Excel import/export */}
      <Button variant="outline" onClick={onDownloadTemplate}>
        <Download className="w-4 h-4 mr-2" />
        {productsCount > 0 ? 'Exportar Excel' : 'Descargar Plantilla'}
      </Button>
      <Button variant="outline" onClick={onImportCSV}>
        <Upload className="w-4 h-4 mr-2" />
        Importar Excel
      </Button>
      <Button onClick={onCreateProduct}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo producto
      </Button>
    </div>
  )
}

