import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin/signup') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Si es la raíz, redirigir a la landing o página de login
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Si es una ruta de admin sin autenticación, permitir
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Rutas con storeSlug
  if (pathname.split('/').length === 2 || pathname.startsWith('/[')) {
    // Permitir acceso a tiendas públicas
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

