import { useState, useEffect } from "react"
import { getSheetInfo, syncProductsFromSheets, createSheetBackup, createGoogleSheet } from "@/lib/controlfile-api"

export function useGoogleSheets(storeId: string | undefined, storeName: string | undefined, onSyncComplete: () => void) {
  const [sheetInfo, setSheetInfo] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")

  useEffect(() => {
    if (storeId) {
      loadSheetInfo()
    }
  }, [storeId])

  const loadSheetInfo = async () => {
    if (!storeId) return
    
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

  const handleCreateSheet = async () => {
    if (!storeId) return
    
    setIsCreatingSheet(true)
    try {
      const { getAuth } = await import('firebase/auth')
      const userEmail = getAuth().currentUser?.email || ''
      const name = storeName || 'Tienda'

      const res = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, storeName: name, shareWithEmail: userEmail })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(`Error: ${data.error || 'No se pudo crear la hoja'}`)
        return
      }
      const { updateStoreConfig } = await import('@/lib/stores')
      await updateStoreConfig(storeId, { googleSheetsUrl: data.editUrl, spreadsheetId: data.spreadsheetId })
      setSheetInfo({ sheetId: data.spreadsheetId, editUrl: data.editUrl, lastSyncedAt: new Date().toISOString() })
      alert(`✅ Hoja creada correctamente!\n\nPuedes editarla aquí: ${data.editUrl}`)
      onSyncComplete()
      
    } catch (error) {
      console.error('Error creando hoja:', error)
      alert('Error al crear la hoja')
      setIsCreatingSheet(false)
    }
  }


  const handleSync = async () => {
    if (!storeId) return
    
    setIsSyncing(true)
    try {
      const response = await syncProductsFromSheets(storeId)
      
      if (response.success) {
        await loadSheetInfo()
        onSyncComplete()
        alert(`✅ Se sincronizaron ${response.data?.count || 0} productos desde Google Sheets\n\nLos cambios ya están disponibles en la tienda pública.`)
      } else {
        alert(`Error: ${response.error || 'No se pudo sincronizar'}`)
      }
    } catch (error) {
      console.error('Error sincronizando:', error)
      alert('Error al sincronizar desde Google Sheets')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!storeId) return
    
    setIsCreatingBackup(true)
    try {
      const response = await createSheetBackup(storeId)
      
      if (response.success && response.data) {
        alert(`✅ Backup creado correctamente!\n\nURL: ${response.data.backupUrl}`)
      } else {
        alert(`Error: ${response.error || 'No se pudo crear el backup'}`)
      }
    } catch (error) {
      console.error('Error creando backup:', error)
      alert('Error al crear el backup')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!storeId) return
    
    try {
      const { updateStoreConfig } = await import('@/lib/stores')
      await updateStoreConfig(storeId, {
        googleSheetsUrl: googleSheetsUrl
      })
      alert("✅ Configuración guardada correctamente")
      setIsConfigOpen(false)
    } catch (error) {
      console.error('Error guardando configuración:', error)
      alert('Error al guardar la configuración')
    }
  }

  return {
    sheetInfo,
    isSyncing,
    isCreatingSheet,
    isCreatingBackup,
    isConfigOpen,
    googleSheetsUrl,
    setGoogleSheetsUrl,
    setIsConfigOpen,
    handleCreateSheet,
    handleSync,
    handleCreateBackup,
    handleSaveConfig
  }
}

