"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Phone, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { animations } from "@/components/ui/animations"
import type { StoreConfig } from "@/lib/types"

interface WelcomeMessageProps {
  storeConfig: StoreConfig
  className?: string
}

export function WelcomeMessage({ storeConfig, className }: WelcomeMessageProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Verificar si la tienda está abierta
  const isStoreOpen = () => {
    if (!storeConfig.schedule) return true
    
    const now = currentTime
    const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' }) as keyof typeof storeConfig.schedule
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinute
    
    const todaySchedule = storeConfig.schedule[day]
    if (!todaySchedule || todaySchedule.closed) return false
    
    const [openHour, openMinute] = todaySchedule.open.split(':').map(Number)
    const [closeHour, closeMinute] = todaySchedule.close.split(':').map(Number)
    
    const openTimeMinutes = openHour * 60 + openMinute
    const closeTimeMinutes = closeHour * 60 + closeMinute
    
    return currentTimeMinutes >= openTimeMinutes && currentTimeMinutes <= closeTimeMinutes
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "¡Buenos días!"
    if (hour < 18) return "¡Buenas tardes!"
    return "¡Buenas noches!"
  }

  const getNextOpeningTime = () => {
    if (!storeConfig.schedule) return null
    
    const now = currentTime
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1
    
    // Buscar el próximo día abierto
    for (let i = 0; i < 7; i++) {
      const dayIndex = (currentDayIndex + i) % 7
      const day = days[dayIndex]
      const schedule = storeConfig.schedule[day]
      
      if (schedule && !schedule.closed) {
        const dayNames = {
          monday: 'Lunes',
          tuesday: 'Martes', 
          wednesday: 'Miércoles',
          thursday: 'Jueves',
          friday: 'Viernes',
          saturday: 'Sábado',
          sunday: 'Domingo'
        }
        
        if (i === 0) {
          // Mismo día, verificar si ya pasó la hora de cierre
          const [closeHour, closeMinute] = schedule.close.split(':').map(Number)
          const closeTime = new Date(now)
          closeTime.setHours(closeHour, closeMinute, 0, 0)
          
          if (now < closeTime) {
            return `Hoy hasta las ${schedule.close}`
          }
        }
        
        return `${dayNames[day as keyof typeof dayNames]} a las ${schedule.open}`
      }
    }
    
    return null
  }

  const storeOpen = isStoreOpen()
  const nextOpening = getNextOpeningTime()

  if (!storeConfig.contact?.welcomeMessage && !storeConfig.contact?.socialMedia && !storeConfig.location) {
    return null
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-lg",
      storeOpen ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Saludo y mensaje de bienvenida */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {getGreeting()}
              </h2>
              {storeConfig.contact?.welcomeMessage && (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {storeConfig.contact.welcomeMessage}
                </p>
              )}
            </div>

            {/* Estado de la tienda */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={storeOpen ? "default" : "secondary"}
                className={cn(
                  "text-xs font-medium",
                  storeOpen 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-orange-100 text-orange-800 border-orange-200"
                )}
              >
                <Clock className="w-3 h-3 mr-1" />
                {storeOpen ? "Abierto ahora" : "Cerrado"}
              </Badge>
              
              {!storeOpen && nextOpening && (
                <span className="text-xs text-gray-600">
                  Próximo: {nextOpening}
                </span>
              )}
            </div>

            {/* Información de contacto */}
            <div className="flex flex-wrap gap-3 text-sm">
              {storeConfig.phone && (
                <a 
                  href={`tel:${storeConfig.phone}`}
                  className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Llamar</span>
                </a>
              )}
              
              {storeConfig.contact?.socialMedia?.whatsapp && (
                <a 
                  href={`https://wa.me/${storeConfig.contact.socialMedia.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
              
              {storeConfig.address && (
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline truncate max-w-48">{storeConfig.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botón de más información */}
          {(storeConfig.contact?.socialMedia || storeConfig.location) && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "flex-shrink-0 p-2 rounded-full hover:bg-white/50 transition-colors",
                animations.tapScale
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-200",
                isOpen && "rotate-180"
              )}>
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          )}
        </div>

        {/* Información expandible */}
        {isOpen && (
          <div className={cn(
            "mt-4 pt-4 border-t border-gray-200 space-y-3",
            animations.fadeIn
          )}>
            {/* Redes sociales */}
            {storeConfig.contact?.socialMedia && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Síguenos</h4>
                <div className="flex gap-3">
                  {storeConfig.contact.socialMedia.instagram && (
                    <a 
                      href={`https://instagram.com/${storeConfig.contact.socialMedia.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-pink-600 hover:text-pink-700 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </a>
                  )}
                  
                  {storeConfig.contact.socialMedia.facebook && (
                    <a 
                      href={`https://facebook.com/${storeConfig.contact.socialMedia.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Ubicación */}
            {storeConfig.location && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Ubicación</h4>
                <p className="text-sm text-gray-600">{storeConfig.location.address || storeConfig.address}</p>
                {storeConfig.location.showMap && storeConfig.location.latitude && storeConfig.location.longitude && (
                  <a 
                    href={`https://maps.google.com/?q=${storeConfig.location.latitude},${storeConfig.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver en Google Maps
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
