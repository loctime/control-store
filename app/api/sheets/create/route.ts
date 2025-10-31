export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY faltante')
  
  let parsed: any
  try {
    // Intentar parsear directamente primero
    parsed = JSON.parse(raw)
  } catch (e: any) {
    // Si falla, intentar normalizar saltos de línea
    try {
      // Reemplazar saltos de línea reales por \n escapado
      const normalized = raw.replace(/\r?\n/g, '\\n').replace(/\r/g, '\\n')
      parsed = JSON.parse(normalized)
    } catch (e2: any) {
      throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY inválido: ${e2.message}`)
    }
  }
  
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || parsed.client_email
  let key = parsed.private_key
  
  if (!email || !key) {
    throw new Error('Service Account incompleta: client_email o private_key faltan')
  }
  
  // Normalizar el private_key: convertir cualquier forma de \n a saltos de línea reales
  // Maneja: \\n (doble backslash), \n (backslash + n), y saltos reales
  key = key
    .replace(/\\\\n/g, '\n')  // \\n (doble backslash) -> salto real
    .replace(/\\n/g, '\n')   // \n (escapado) -> salto real
    .replace(/\r\n/g, '\n')  // Windows line endings
    .replace(/\r/g, '\n')    // Mac line endings
  
  // Validar que la key tenga el formato PEM correcto
  if (!key.includes('BEGIN PRIVATE KEY') || !key.includes('END PRIVATE KEY')) {
    throw new Error('private_key no tiene formato PEM válido')
  }
  
  return { email, key }
}

export async function POST(req: NextRequest) {
  try {
    const { storeId, storeName, shareWithEmail } = await req.json()
    if (!storeId || !storeName) {
      return NextResponse.json({ success: false, error: 'storeId y storeName requeridos' }, { status: 400 })
    }

    const { email, key } = getServiceAccount()
    try {
      console.info('[sheets:create] env', {
        sa_email_tail: email?.slice(-20),
        has_key: !!key,
        has_parent: !!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
      })
    } catch {}
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
    ]
    const jwt = new google.auth.JWT(email, undefined, key, scopes)
    try {
      await jwt.authorize()
      console.info('[sheets:create] SA authorized')
    } catch (e: any) {
      console.error('[sheets:create] authorize error', e?.message)
      throw e
    }

    const sheets = google.sheets({ version: 'v4', auth: jwt })
    const drive = google.drive({ version: 'v3', auth: jwt })

    // 1) Crear Spreadsheet (vía Drive para evitar restricciones en algunos entornos)
    const title = `Control Store - ${storeName} - Productos`
    let spreadsheetId: string
    try {
      const fileRes = await drive.files.create({
        requestBody: {
          name: title,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ? [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID] : undefined,
        },
        fields: 'id',
        supportsAllDrives: true,
      })
      spreadsheetId = (fileRes.data.id || '') as string
      if (!spreadsheetId) throw new Error('No se obtuvo spreadsheetId')
      console.info('[sheets:create] spreadsheet created (drive.files.create)')
    } catch (e: any) {
      console.error('[sheets:create] drive create error', e?.message)
      throw e
    }
    const editUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    // 2) Ya se creó en la carpeta; intento idempotente de asegurar parent (ignorable si falla)
    const parent = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    if (parent) {
      try {
        await drive.files.update({ fileId: spreadsheetId, addParents: parent, fields: 'id, parents', supportsAllDrives: true })
      } catch (e: any) {
        console.warn('[sheets:create] ensure parent warning', e?.message)
      }
    }

    // 3) Compartir con el cliente (opcional)
    if (shareWithEmail) {
      try {
      await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: { role: 'writer', type: 'user', emailAddress: shareWithEmail },
          sendNotificationEmail: false,
        supportsAllDrives: true,
        })
        console.info('[sheets:create] shared with user', { email_tail: shareWithEmail.slice(-10) })
      } catch (e: any) {
        console.error('[sheets:create] share error', e?.message)
        throw e
      }
    }

    return NextResponse.json({ success: true, spreadsheetId, editUrl })
  } catch (e: any) {
    console.error('[sheets:create] failed', { message: e?.message })
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


