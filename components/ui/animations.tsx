"use client"

import { cn } from "@/lib/utils"

// Clases de animación predefinidas
export const animations = {
  // Entrada
  fadeIn: "animate-in fade-in-0 duration-300",
  slideInFromTop: "animate-in slide-in-from-top-4 duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom-4 duration-300",
  slideInFromLeft: "animate-in slide-in-from-left-4 duration-300",
  slideInFromRight: "animate-in slide-in-from-right-4 duration-300",
  
  // Salida
  fadeOut: "animate-out fade-out-0 duration-200",
  slideOutToTop: "animate-out slide-out-to-top-4 duration-200",
  slideOutToBottom: "animate-out slide-out-to-bottom-4 duration-200",
  slideOutToLeft: "animate-out slide-out-to-left-4 duration-200",
  slideOutToRight: "animate-out slide-out-to-right-4 duration-200",
  
  // Hover
  hoverScale: "hover:scale-105 transition-transform duration-200 ease-out",
  hoverScaleSmall: "hover:scale-102 transition-transform duration-150 ease-out",
  hoverLift: "hover:-translate-y-1 transition-transform duration-200 ease-out",
  hoverGlow: "hover:shadow-lg hover:shadow-primary/20 transition-shadow duration-300",
  
  // Micro-interacciones
  tapScale: "active:scale-95 transition-transform duration-100",
  bounce: "hover:animate-bounce",
  pulse: "hover:animate-pulse",
  wiggle: "hover:animate-wiggle",
  
  // Transiciones suaves
  smooth: "transition-all duration-300 ease-in-out",
  smoothFast: "transition-all duration-150 ease-in-out",
  smoothSlow: "transition-all duration-500 ease-in-out",
  
  // Efectos especiales
  shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
  gradient: "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
  
  // Estados de carga
  loading: "animate-pulse bg-muted",
  skeleton: "animate-pulse bg-muted rounded",
}

// Hook para animaciones condicionales
export function useAnimations(enabled: boolean = true) {
  return {
    fadeIn: enabled ? animations.fadeIn : "",
    slideInFromTop: enabled ? animations.slideInFromTop : "",
    slideInFromBottom: enabled ? animations.slideInFromBottom : "",
    slideInFromLeft: enabled ? animations.slideInFromLeft : "",
    slideInFromRight: enabled ? animations.slideInFromRight : "",
    hoverScale: enabled ? animations.hoverScale : "",
    hoverLift: enabled ? animations.hoverLift : "",
    hoverGlow: enabled ? animations.hoverGlow : "",
    tapScale: enabled ? animations.tapScale : "",
    smooth: enabled ? animations.smooth : "",
  }
}

// Componente de animación de entrada escalonada
interface StaggeredAnimationProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function StaggeredAnimation({ 
  children, 
  delay = 0, 
  className 
}: StaggeredAnimationProps) {
  return (
    <div 
      className={cn(
        animations.fadeIn,
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  )
}

// Componente de animación de hover mejorada
interface HoverAnimationProps {
  children: React.ReactNode
  variant?: 'scale' | 'lift' | 'glow' | 'bounce' | 'pulse'
  className?: string
}

export function HoverAnimation({ 
  children, 
  variant = 'scale', 
  className 
}: HoverAnimationProps) {
  const variantClasses = {
    scale: animations.hoverScale,
    lift: animations.hoverLift,
    glow: animations.hoverGlow,
    bounce: animations.bounce,
    pulse: animations.pulse,
  }

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  )
}

// Componente de shimmer loading
interface ShimmerProps {
  className?: string
  children?: React.ReactNode
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={cn(animations.shimmer, className)}>
      {children}
    </div>
  )
}

// Componente de skeleton
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            animations.skeleton,
            "h-4 w-full",
            i === lines - 1 && "w-3/4" // Última línea más corta
          )}
        />
      ))}
    </div>
  )
}

// Utilidad para combinar animaciones
export function combineAnimations(...animations: string[]) {
  return animations.filter(Boolean).join(' ')
}
