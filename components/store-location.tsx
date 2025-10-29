"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Navigation, Phone, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { animations } from "@/components/ui/animations"
import type { StoreConfig } from "@/lib/types"

interface StoreLocationProps {
  storeConfig: StoreConfig
  className?: string
  showMap?: boolean
}

export function StoreLocation({ storeConfig, className, showMap = true }: StoreLocationProps) {
  const [mapLoaded, setMapLoaded] = useState(false)

  if (!storeConfig.location && !storeConfig.address) {
    return null
  }

  const address = storeConfig.location?.address || storeConfig.address
  const latitude = storeConfig.location?.latitude
  const longitude = storeConfig.location?.longitude

  const getGoogleMapsUrl = () => {
    if (latitude && longitude) {
      return `https://maps.google.com/?q=${latitude},${longitude}`
    }
    return `https://maps.google.com/?q=${encodeURIComponent(address || '')}`
  }

  const getDirectionsUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || '')}`
  }

  const handleMapLoad = () => {
    setMapLoaded(true)
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Ubicación
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dirección */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Dirección</p>
          <p className="font-medium text-sm leading-relaxed">{address}</p>
        </div>

        {/* Mapa embebido */}
        {showMap && (latitude && longitude) && (
          <div className="relative">
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center space-y-2">
                    <MapPin className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cargando mapa...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dOWWgHjv0Lc'}&q=${latitude},${longitude}&zoom=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={handleMapLoad}
                className={cn(
                  "transition-opacity duration-300",
                  mapLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center gap-2"
            onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Ver en Google Maps
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center gap-2"
            onClick={() => window.open(getDirectionsUrl(), '_blank')}
          >
            <Navigation className="w-4 h-4" />
            Cómo llegar
          </Button>
        </div>

        {/* Información de contacto adicional */}
        <div className="pt-3 border-t border-muted space-y-3">
          {storeConfig.phone && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Teléfono</span>
              <a 
                href={`tel:${storeConfig.phone}`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {storeConfig.phone}
              </a>
            </div>
          )}

          {storeConfig.contact?.socialMedia?.whatsapp && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">WhatsApp</span>
              <a 
                href={`https://wa.me/${storeConfig.contact.socialMedia.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar mensaje
              </a>
            </div>
          )}

          {storeConfig.contact?.email && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <a 
                href={`mailto:${storeConfig.contact.email}`}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {storeConfig.contact.email}
              </a>
            </div>
          )}

          {storeConfig.contact?.website && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sitio web</span>
              <a 
                href={storeConfig.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visitar sitio
              </a>
            </div>
          )}
        </div>

        {/* Información de delivery */}
        {storeConfig.deliveryFee > 0 && (
          <div className="pt-3 border-t border-muted">
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium">Información de delivery</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Costo de envío: {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 0,
                  }).format(storeConfig.deliveryFee)}
                </p>
                {storeConfig.minOrderAmount > 0 && (
                  <p>
                    Pedido mínimo: {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 0,
                    }).format(storeConfig.minOrderAmount)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
