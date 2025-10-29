// API client para Controlfile backend
const CONTROLFILE_BASE_URL = process.env.NEXT_PUBLIC_CONTROLFILE_URL || 'https://controlfile.onrender.com'

export interface ControlfileResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SheetInfo {
  sheetId: string
  editUrl: string
  lastSynced?: string
}

export interface ProductsResponse {
  products: any[]
  categories: any[]
}

export interface SyncResponse {
  success: boolean
  count: number
}

export interface BackupResponse {
  success: boolean
  backupUrl: string
}

// Crear hoja en Google Drive del cliente
export async function createGoogleSheet(storeId: string, authCode: string): Promise<ControlfileResponse<SheetInfo>> {
  try {
    const response = await fetch(`${CONTROLFILE_BASE_URL}/api/stores/${storeId}/sheets/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authCode }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating Google Sheet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Obtener productos desde Google Sheets
export async function getProductsFromSheets(storeId: string): Promise<ControlfileResponse<ProductsResponse>> {
  try {
    const response = await fetch(`${CONTROLFILE_BASE_URL}/api/stores/${storeId}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching products from sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Sincronizar productos desde Google Sheets
export async function syncProductsFromSheets(storeId: string): Promise<ControlfileResponse<SyncResponse>> {
  try {
    const response = await fetch(`${CONTROLFILE_BASE_URL}/api/stores/${storeId}/sheets/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error syncing products from sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Crear backup de la hoja
export async function createSheetBackup(storeId: string): Promise<ControlfileResponse<BackupResponse>> {
  try {
    const response = await fetch(`${CONTROLFILE_BASE_URL}/api/stores/${storeId}/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating sheet backup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Obtener información de la hoja configurada
export async function getSheetInfo(storeId: string): Promise<ControlfileResponse<SheetInfo>> {
  try {
    const response = await fetch(`${CONTROLFILE_BASE_URL}/api/stores/${storeId}/sheets/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching sheet info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
