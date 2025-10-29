"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ColorPicker } from "./color-picker"
import { ImageUpload } from "./image-upload"

interface BackgroundConfig {
  image?: string
  color?: string
  overlay?: number
}

interface BackgroundSelectorProps {
  section: string
  label?: string
  value?: BackgroundConfig
  onChange: (config: BackgroundConfig) => void
}

export function BackgroundSelector({ 
  section, 
  label, 
  value = {}, 
  onChange 
}: BackgroundSelectorProps) {
  const updateConfig = (key: keyof BackgroundConfig, newValue: any) => {
    onChange({
      ...value,
      [key]: newValue
    })
  }

  return (
    <div className="space-y-4">
      {label && <Label className="text-base font-medium">{label}</Label>}
      
      {/* Selector de imagen */}
      <div>
        <Label>Imagen de fondo</Label>
        <ImageUpload 
          value={value.image}
          onChange={(url) => updateConfig('image', url)}
          placeholder="Sube una imagen de fondo"
        />
      </div>

      {/* Selector de color */}
      <ColorPicker
        label="Color de fondo"
        value={value.color || "#ffffff"}
        onChange={(color) => updateConfig('color', color)}
        placeholder="#ffffff"
      />

      {/* Opacidad del overlay */}
      <div>
        <Label>Opacidad del overlay: {Math.round((value.overlay || 0.5) * 100)}%</Label>
        <Slider
          value={[(value.overlay || 0.5) * 100]}
          onValueChange={([opacity]) => updateConfig('overlay', opacity / 100)}
          max={100}
          step={10}
          className="w-full mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Controla qué tan transparente es el overlay sobre la imagen
        </p>
      </div>

      {/* Vista previa */}
      <div className="p-4 border rounded-lg">
        <Label className="text-sm font-medium">Vista previa</Label>
        <div 
          className="mt-2 h-20 rounded border relative overflow-hidden"
          style={{
            backgroundImage: value.image ? `url(${value.image})` : undefined,
            backgroundColor: value.color || "#ffffff",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          {value.image && (
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${value.overlay || 0.5})`
              }}
            />
          )}
          <div className="relative z-10 p-2">
            <p className="text-sm font-medium text-white drop-shadow">
              {label || "Sección"}
            </p>
            <p className="text-xs text-white/80 drop-shadow">
              Contenido de ejemplo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
