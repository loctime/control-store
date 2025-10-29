"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      // Error en la autenticación
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: error
      }, window.location.origin)
      window.close()
      return
    }

    if (code) {
      // Éxito en la autenticación
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_SUCCESS',
        authCode: code,
        state: state
      }, window.location.origin)
      window.close()
      return
    }

    // Si no hay código ni error, cerrar
    window.close()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Procesando autenticación...</p>
      </div>
    </div>
  )
}
