"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { animations } from "@/components/ui/animations"
import type { StoreConfig } from "@/lib/types"

interface StoreScheduleProps {
  storeConfig: StoreConfig
  className?: string
  compact?: boolean
}

export function StoreSchedule({ storeConfig, className, compact = false }: StoreScheduleProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isExpanded, setIsExpanded] = useState(!compact)

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Verificar si la tienda está abierta
  const isStoreOpen = () => {
    if (!storeConfig.schedule) {
      // Fallback a horarios básicos si no hay schedule detallado
      return true
    }
    
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

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    return new Date(0, 0, 0, hour, minute).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDayName = (day: string) => {
    const dayNames: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    }
    return dayNames[day] || day
  }

  const storeOpen = isStoreOpen()
  const nextOpening = getNextOpeningTime()

  if (!storeConfig.schedule && !storeConfig.openingHours) {
    return null
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horarios de Atención
          </CardTitle>
          
          {!compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Estado actual */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={storeOpen ? "default" : "secondary"}
            className={cn(
              "text-sm font-medium",
              storeOpen 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-orange-100 text-orange-800 border-orange-200"
            )}
          >
            {storeOpen ? "Abierto ahora" : "Cerrado"}
          </Badge>
          
          {!storeOpen && nextOpening && (
            <span className="text-sm text-muted-foreground">
              Próximo: {nextOpening}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {storeConfig.schedule ? (
          // Horarios detallados
          <div className={cn(
            "space-y-2",
            !isExpanded && compact && "hidden"
          )}>
            {Object.entries(storeConfig.schedule).map(([day, schedule]) => {
              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' }) === day
              
              return (
                <div 
                  key={day}
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg transition-colors",
                    isToday && "bg-primary/5 border border-primary/20",
                    animations.smooth
                  )}
                >
                  <span className={cn(
                    "font-medium text-sm",
                    isToday && "text-primary font-semibold"
                  )}>
                    {getDayName(day)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {schedule.closed ? (
                      <span className="text-sm text-muted-foreground">Cerrado</span>
                    ) : (
                      <span className="text-sm font-medium">
                        {formatTime(schedule.open)} - {formatTime(schedule.close)}
                      </span>
                    )}
                    
                    {isToday && (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        storeOpen ? "bg-green-500" : "bg-orange-500"
                      )} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Horarios básicos
          <div className={cn(
            "space-y-2",
            !isExpanded && compact && "hidden"
          )}>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
              <span className="font-medium text-sm">Horarios</span>
              <span className="text-sm">{storeConfig.openingHours}</span>
            </div>
          </div>
        )}

        {/* Información adicional */}
        {storeConfig.deliveryFee > 0 && (
          <div className="mt-4 pt-3 border-t border-muted">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Costo de envío</span>
              <span className="font-medium">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 0,
                }).format(storeConfig.deliveryFee)}
              </span>
            </div>
            
            {storeConfig.minOrderAmount > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Pedido mínimo</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 0,
                  }).format(storeConfig.minOrderAmount)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
