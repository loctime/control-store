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

    // 1) Crear Spreadsheet
    const title = `Control Store - ${storeName} - Productos`
    let createRes
    try {
      createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [{ properties: { title: 'Productos' } }],
      },
      })
      console.info('[sheets:create] spreadsheet created')
    } catch (e: any) {
      console.error('[sheets:create] create spreadsheet error', e?.message)
      throw e
    }
    const spreadsheetId = createRes.data.spreadsheetId as string
    const editUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    // 2) Mover a carpeta padre si está configurada
    const parent = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
    if (parent) {
      try {
        await drive.files.update({
          fileId: spreadsheetId,
          addParents: parent,
          fields: 'id, parents',
        })
        console.info('[sheets:create] moved to parent folder')
      } catch (e: any) {
        console.error('[sheets:create] move file error', e?.message)
        throw e
      }
    }

    // 3) Compartir con el cliente (opcional)
    if (shareWithEmail) {
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: { role: 'writer', type: 'user', emailAddress: shareWithEmail },
          sendNotificationEmail: false,
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


