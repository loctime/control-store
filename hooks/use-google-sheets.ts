import { useState } from "react"
import { getSheetInfo, syncProductsFromSheets, createSheetBackup } from "@/lib/controlfile-api"

export function useGoogleSheets() {
  const [sheetInfo, setSheetInfo] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  const loadSheetInfo = async (storeId: string) => {
    try {
      const response = await getSheetInfo(storeId)
      if (response.success && response.data) {
        setSheetInfo(response.data)
      } else {
        setSheetInfo(null)
      }
    } catch (error) {
      console.error('Error cargando información de la hoja:', error)
      setSheetInfo(null)
    }
  }

  const syncFromSheets = async (storeId: string) => {
    setIsSyncing(true)
    try {
      const response = await syncProductsFromSheets(storeId)
      if (response.success) {
        await loadSheetInfo(storeId)
        return response
      }
      return response
    } catch (error) {
      console.error('Error sincronizando:', error)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const createBackup = async (storeId: string) => {
    setIsCreatingBackup(true)
    try {
      const response = await createSheetBackup(storeId)
      return response
    } catch (error) {
      console.error('Error creando backup:', error)
      throw error
    } finally {
      setIsCreatingBackup(false)
    }
  }

  return {
    sheetInfo,
    isSyncing,
    isCreatingSheet,
    isCreatingBackup,
    loadSheetInfo,
    syncFromSheets,
    createBackup,
    setIsCreatingSheet
  }
}

