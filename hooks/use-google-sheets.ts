import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

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
      const ref = doc(db as any, 'apps', 'control-store', 'stores', storeId)
      const snap = await getDoc(ref)
      if (!snap.exists()) { setSheetInfo(null); return }
      const data: any = snap.data()
      const spreadsheetId = data?.spreadsheetId
      const editUrl = data?.googleSheetsUrl
      if (spreadsheetId || editUrl) {
        setSheetInfo({ sheetId: spreadsheetId || 'unknown', editUrl: editUrl || '', lastSyncedAt: new Date().toISOString() })
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
    // En el flujo con Service Account y sin backend de ControlFile,
    // la sincronización automática no está implementada aún.
    alert('Sincronización desde Sheets no disponible en esta versión')
  }

  const handleCreateBackup = async () => {
    alert('Backup no disponible en esta versión')
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

