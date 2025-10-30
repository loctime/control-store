import { useState, useEffect } from "react"
import { getSheetInfo, syncProductsFromSheets, createSheetBackup, createGoogleSheet } from "@/lib/controlfile-api"

export function useGoogleSheets(storeId: string | undefined, onSyncComplete: () => void) {
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
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
      const redirectUri = `${origin}/api/oauth/google/callback`
      const scopes = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets'
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scopes}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${storeId}`

      // Logs seguros para diagnóstico en producción
      try {
        const masked = clientId ? clientId.replace(/^(.{6}).*(.{6})$/, '$1••••••••••$2') : 'NO_CLIENT_ID'
        console.info('[Sheets] auth params', {
          origin,
          clientId: masked,
          redirectUri,
          scopes,
          storeId
        })
      } catch {}
      
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600')
      
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { authCode } = event.data
          console.info('[Sheets] callback OK, received authCode (masked)')
          createSheetWithAuthCode(authCode)
          window.removeEventListener('message', messageListener)
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.warn('[Sheets] callback error', event.data)
          alert('Error en la autenticación de Google')
          setIsCreatingSheet(false)
          window.removeEventListener('message', messageListener)
        }
      }
      
      window.addEventListener('message', messageListener)
      
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setIsCreatingSheet(false)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error creando hoja:', error)
      alert('Error al crear la hoja')
      setIsCreatingSheet(false)
    }
  }

  const createSheetWithAuthCode = async (authCode: string) => {
    if (!storeId) return
    
    try {
      const response = await createGoogleSheet(storeId, authCode)
      
      if (response.success && response.data) {
        setSheetInfo(response.data)
        alert(`✅ Hoja creada correctamente!\n\nPuedes editarla aquí: ${response.data.editUrl}`)
        onSyncComplete()
      } else {
        alert(`Error: ${response.error || 'No se pudo crear la hoja'}`)
      }
    } catch (error) {
      console.error('Error creando hoja:', error)
      alert('Error al crear la hoja')
    } finally {
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

