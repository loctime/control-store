"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Download, Upload, Settings, Link as LinkIcon, RefreshCw, MoreVertical } from "lucide-react"

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
      {/* Botón principal - siempre visible */}
      <Button onClick={onCreateProduct} className="order-last sm:order-first">
        <Plus className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Nuevo producto</span>
        <span className="sm:hidden">Nuevo</span>
      </Button>

      {/* Dropdown para acciones secundarias en móvil */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="sm:hidden">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Google Sheets */}
          {!hasSheetInfo ? (
            <DropdownMenuItem onClick={onCreateGoogleSheet} disabled={isCreatingSheet}>
              <Plus className="w-4 h-4 mr-2" />
              Crear hoja en Google Drive
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={onSyncFromSheets} disabled={isSyncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar desde Google Sheets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSheet}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Abrir hoja
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateBackup} disabled={isCreatingBackup}>
                <Download className="w-4 h-4 mr-2" />
                Crear backup
              </DropdownMenuItem>
              {lastSynced && (
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground w-full">
                    Última sync: {new Date(lastSynced).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Excel */}
          <DropdownMenuItem onClick={onImportCSV}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            {productsCount > 0 ? 'Exportar Excel' : 'Descargar Plantilla'}
          </DropdownMenuItem>

          {/* Configuración legacy */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onConfigLegacy}>
            <Settings className="w-4 h-4 mr-2" />
            Configuración legacy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Acciones secundarias - visibles solo en desktop */}
      <div className="hidden sm:flex gap-2">
        {/* Google Sheets */}
        {!hasSheetInfo ? (
          <Button variant="outline" onClick={onCreateGoogleSheet} disabled={isCreatingSheet}>
            <Plus className="w-4 h-4 mr-2" />
            Crear hoja en Google Drive
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onSyncFromSheets} disabled={isSyncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar desde Google Sheets
              </Button>
              {lastSynced && (
                <span className="text-xs text-muted-foreground">
                  Última sync: {new Date(lastSynced).toLocaleString()}
                </span>
              )}
            </div>
            <Button variant="outline" onClick={onCreateBackup} disabled={isCreatingBackup}>
              <Download className="w-4 h-4 mr-2" />
              Crear backup
            </Button>
            <Button variant="outline" onClick={onOpenSheet}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Abrir hoja
            </Button>
          </>
        )}

        {/* Excel */}
        <Button variant="outline" onClick={onDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          {productsCount > 0 ? 'Exportar Excel' : 'Descargar Plantilla'}
        </Button>
        <Button variant="outline" onClick={onImportCSV}>
          <Upload className="w-4 h-4 mr-2" />
          Importar Excel
        </Button>

        {/* Configuración legacy */}
        <Button variant="outline" onClick={onConfigLegacy}>
          <Settings className="w-4 h-4 mr-2" />
          Configuración legacy
        </Button>
      </div>
    </div>
  )
}

