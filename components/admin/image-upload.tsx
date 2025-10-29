"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Image, Upload, X } from "lucide-react"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  placeholder?: string
  accept?: string
  maxSize?: number // en MB
}

export function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Sube una imagen aquí",
  accept = "image/*",
  maxSize = 2
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo debe ser menor a ${maxSize}MB`)
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Simular subida de archivo
      // En una implementación real, aquí subirías el archivo a Firebase Storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setError('Error al subir la imagen')
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("")
    setError(null)
  }

  if (value) {
    return (
      <div className="space-y-2">
        <Label>Imagen actual</Label>
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-lg border"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Subiendo..." : "Cambiar imagen"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Subir imagen</Label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Image className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{placeholder}</p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG hasta {maxSize}MB
            </p>
          </div>
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
