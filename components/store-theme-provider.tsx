"use client"

import { useEffect } from "react"
import type { Store } from "@/lib/types"

interface StoreThemeProviderProps {
  store: Store | null
  children: React.ReactNode
}

export function StoreThemeProvider({ store, children }: StoreThemeProviderProps) {
  const theme = store?.config?.branding

  useEffect(() => {
    if (!theme) return

    const root = document.documentElement

    // Aplicar colores personalizados
    if (theme.primaryColor) {
      root.style.setProperty('--primary', theme.primaryColor)
    }
    if (theme.secondaryColor) {
      root.style.setProperty('--secondary', theme.secondaryColor)
    }
    if (theme.accentColor) {
      root.style.setProperty('--accent', theme.accentColor)
    }
    if (theme.backgroundColor) {
      root.style.setProperty('--background', theme.backgroundColor)
    }
    if (theme.textColor) {
      root.style.setProperty('--foreground', theme.textColor)
    }
    
    // Aplicar bordes redondeados
    if (theme.borderRadius) {
      const radiusMap = {
        'sm': '0.25rem',
        'md': '0.5rem', 
        'lg': '0.75rem',
        'xl': '1rem'
      }
      root.style.setProperty('--radius', radiusMap[theme.borderRadius] || '0.5rem')
    }

    // Aplicar colores de fondo por sección
    const backgrounds = store?.config?.backgrounds
    if (backgrounds) {
      if (backgrounds.featured?.color) {
        root.style.setProperty('--featured-bg', backgrounds.featured.color)
      }
      if (backgrounds.menu?.color) {
        root.style.setProperty('--menu-bg', backgrounds.menu.color)
      }
    }

    // Aplicar configuración de animaciones
    const animations = store?.config?.animations
    if (animations) {
      if (!animations.enableHover) {
        root.style.setProperty('--hover-scale', '1')
        root.style.setProperty('--hover-lift', '0')
      }
      if (!animations.enableTransitions) {
        root.style.setProperty('--transition-duration', '0ms')
      }
      
      const speedMap = {
        'slow': '500ms',
        'normal': '300ms',
        'fast': '150ms'
      }
      if (animations.animationSpeed) {
        root.style.setProperty('--animation-duration', speedMap[animations.animationSpeed] || '300ms')
      }
    }

  }, [theme, store?.config?.backgrounds, store?.config?.animations])

  return <>{children}</>
}
