export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

function getServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY faltante')
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY inválido: debe ser JSON en una sola línea')
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || parsed.client_email
  const key = parsed.private_key
  if (!email || !key) throw new Error('Service Account incompleta: client_email o private_key faltan')
  return { email, key }
}

export async function POST(req: NextRequest) {
  try {
    const { storeId, storeName, shareWithEmail } = await req.json()
    if (!storeId || !storeName) {
      return NextResponse.json({ success: false, error: 'storeId y storeName requeridos' }, { status: 400 })
    }

    const { email, key } = getServiceAccount()
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
    ]
    const jwt = new google.auth.JWT(email, undefined, key, scopes)
    await jwt.authorize()

    const sheets = google.sheets({ version: 'v4', auth: jwt })
    const drive = google.drive({ version: 'v3', auth: jwt })

    // 1) Crear Spreadsheet
    const title = `Control Store - ${storeName} - Productos`
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [{ properties: { title: 'Productos' } }],
      },
    })
    const spreadsheetId = createRes.data.spreadsheetId as string
    const editUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    // 2) Mover a carpeta padre si está configurada
    const parent = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    if (parent) {
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: parent,
        fields: 'id, parents',
      })
    }

    // 3) Compartir con el cliente (opcional)
    if (shareWithEmail) {
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: { role: 'writer', type: 'user', emailAddress: shareWithEmail },
        sendNotificationEmail: false,
      })
    }

    return NextResponse.json({ success: true, spreadsheetId, editUrl })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}


