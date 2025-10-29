"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Store, LogOut, Save, Palette, Image, Settings, MessageCircle, Clock, MapPin } from "lucide-react"
import { useStore } from "@/lib/store"
import type { Store as StoreType, StoreConfig } from "@/lib/types"

export default function CustomizationPage() {
  const router = useRouter()
  const { user, logout } = useStore()
  const [store, setStore] = useState<StoreType | null>(null)
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: "Mi Restaurante",
    phone: "",
    address: "",
    deliveryFee: 0,
    minOrderAmount: 0,
    openingHours: "",
    branding: {
      logoIcon: "store",
      primaryColor: "#f97316",
      secondaryColor: "#fbbf24",
      accentColor: "#ef4444",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderRadius: "md"
    },
    backgrounds: {
      featured: {
        color: "#fef3c7",
        overlay: 0.1
      },
      menu: {
        color: "#f9fafb",
        overlay: 0.05
      },
      categories: {}
    },
    ui: {
      showPrices: true,
      showDescriptions: true,
      productImageSize: "medium",
      cardStyle: "detailed",
      layout: "grid"
    },
    contact: {
      welcomeMessage: "¡Bienvenidos a nuestra tienda! Realizamos pedidos online con delivery y retiro en local.",
      email: "",
      website: "",
      socialMedia: {
        whatsapp: "",
        instagram: "",
        facebook: "",
        twitter: ""
      }
    },
    location: {
      latitude: 0,
      longitude: 0,
      address: "",
      showMap: false
    },
    schedule: {
      monday: { open: "09:00", close: "22:00", closed: false },
      tuesday: { open: "09:00", close: "22:00", closed: false },
      wednesday: { open: "09:00", close: "22:00", closed: false },
      thursday: { open: "09:00", close: "22:00", closed: false },
      friday: { open: "09:00", close: "22:00", closed: false },
      saturday: { open: "09:00", close: "22:00", closed: false },
      sunday: { open: "09:00", close: "22:00", closed: false }
    },
    animations: {
      enableHover: true,
      enableTransitions: true,
      enableMicroInteractions: true,
      animationSpeed: "normal"
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/admin")
      return
    }
    loadStoreData()
  }, [user, router])

  async function loadStoreData() {
    try {
      setIsLoading(true)
      // Aquí cargarías los datos de la tienda desde Firestore
      // Por ahora usamos datos de ejemplo
      setStore({
        id: "demo-store",
        slug: "demo",
        name: "Mi Restaurante",
        ownerEmail: user?.email || "",
        ownerId: user?.uid || "",
        config: storeConfig,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error("Error cargando datos de la tienda:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true)
      // Aquí guardarías los cambios en Firestore
      console.log("Guardando configuración:", storeConfig)
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Error guardando configuración:", error)
    } finally {
      setIsSaving(false)
    }
  }

  function updateConfig(key: keyof StoreConfig, value: any) {
    setStoreConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  function updateBranding(key: keyof NonNullable<StoreConfig['branding']>, value: any) {
    setStoreConfig(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [key]: value
      }
    }))
  }

  function updateUI(key: keyof NonNullable<StoreConfig['ui']>, value: any) {
    setStoreConfig(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        [key]: value
      }
    }))
  }

  function updateBackground(section: 'featured' | 'menu', value: any) {
    setStoreConfig(prev => ({
      ...prev,
      backgrounds: {
        ...prev.backgrounds,
        [section]: {
          ...prev.backgrounds?.[section],
          ...value
        }
      }
    }))
  }

  function handleLogout() {
    logout()
    router.push("/admin")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-lg text-muted-foreground">Cargando personalización...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Personalización</h1>
                <p className="text-sm text-muted-foreground">Personaliza la apariencia de tu tienda</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Marca
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colores
            </TabsTrigger>
            <TabsTrigger value="backgrounds" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Fondos
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Contacto
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horarios
            </TabsTrigger>
            <TabsTrigger value="ui" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Interfaz
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Marca */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Identidad Visual</CardTitle>
                <CardDescription>Personaliza el logo y nombre de tu tienda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <Label>Logo de la tienda</Label>
                  <div className="mt-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                    <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Sube tu logo aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 2MB</p>
                  </div>
                </div>

                {/* Icono de fallback */}
                <div>
                  <Label>Icono de fallback</Label>
                  <Select 
                    value={storeConfig.branding?.logoIcon || "store"}
                    onValueChange={(value) => updateBranding('logoIcon', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store">🏪 Tienda</SelectItem>
                      <SelectItem value="pizza">🍕 Pizza</SelectItem>
                      <SelectItem value="restaurant">🍽️ Restaurante</SelectItem>
                      <SelectItem value="coffee">☕ Café</SelectItem>
                      <SelectItem value="ice-cream">🍦 Heladería</SelectItem>
                      <SelectItem value="bakery">🥖 Panadería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nombre de la tienda */}
                <div>
                  <Label>Nombre de la tienda</Label>
                  <Input 
                    value={storeConfig.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="Nombre de tu tienda"
                  />
                </div>

                {/* Vista previa */}
                <div className="p-6 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-4">Vista previa del header</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                      {storeConfig.branding?.logoIcon === 'pizza' && '🍕'}
                      {storeConfig.branding?.logoIcon === 'restaurant' && '🍽️'}
                      {storeConfig.branding?.logoIcon === 'coffee' && '☕'}
                      {storeConfig.branding?.logoIcon === 'ice-cream' && '🍦'}
                      {storeConfig.branding?.logoIcon === 'bakery' && '🥖'}
                      {(!storeConfig.branding?.logoIcon || storeConfig.branding?.logoIcon === 'store') && '🏪'}
                    </div>
                    <div>
                      <h4 className="font-medium">{storeConfig.name}</h4>
                      <p className="text-sm text-muted-foreground">Pedidos online</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Colores */}
          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Paleta de Colores</CardTitle>
                <CardDescription>Elige los colores de tu tienda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Color Principal</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={storeConfig.branding?.primaryColor || "#f97316"}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input 
                        value={storeConfig.branding?.primaryColor || "#f97316"}
                        onChange={(e) => updateBranding('primaryColor', e.target.value)}
                        placeholder="#f97316"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color Secundario</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={storeConfig.branding?.secondaryColor || "#fbbf24"}
                        onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input 
                        value={storeConfig.branding?.secondaryColor || "#fbbf24"}
                        onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                        placeholder="#fbbf24"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Color de Acento</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={storeConfig.branding?.accentColor || "#ef4444"}
                        onChange={(e) => updateBranding('accentColor', e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input 
                        value={storeConfig.branding?.accentColor || "#ef4444"}
                        onChange={(e) => updateBranding('accentColor', e.target.value)}
                        placeholder="#ef4444"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Vista previa en tiempo real */}
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-4">Vista previa</h3>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: storeConfig.branding?.primaryColor || "#f97316" }}
                    />
                    <div>
                      <h4 className="font-medium">{storeConfig.name}</h4>
                      <p className="text-sm text-muted-foreground">Pedidos online</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Badge 
                      style={{ 
                        backgroundColor: storeConfig.branding?.primaryColor || "#f97316",
                        color: "white"
                      }}
                    >
                      Destacado
                    </Badge>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: storeConfig.branding?.secondaryColor || "#fbbf24",
                        color: "white"
                      }}
                    >
                      Categoría
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Fondos */}
          <TabsContent value="backgrounds">
            <div className="space-y-6">
              {/* Fondo para Destacados */}
              <Card>
                <CardHeader>
                  <CardTitle>Sección Destacados</CardTitle>
                  <CardDescription>Fondo para productos destacados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Imagen de fondo</Label>
                    <div className="mt-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                      <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Sube una imagen de fondo</p>
                    </div>
                  </div>

                  <div>
                    <Label>Color de fondo</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={storeConfig.backgrounds?.featured?.color || "#fef3c7"}
                        onChange={(e) => updateBackground('featured', { color: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                      <Input 
                        value={storeConfig.backgrounds?.featured?.color || "#fef3c7"}
                        onChange={(e) => updateBackground('featured', { color: e.target.value })}
                        placeholder="#fef3c7"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Opacidad del overlay: {Math.round((storeConfig.backgrounds?.featured?.overlay || 0.1) * 100)}%</Label>
                    <Slider
                      value={[(storeConfig.backgrounds?.featured?.overlay || 0.1) * 100]}
                      onValueChange={([opacity]) => updateBackground('featured', { overlay: opacity / 100 })}
                      max={100}
                      step={10}
                      className="w-full mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Fondo para Menú */}
              <Card>
                <CardHeader>
                  <CardTitle>Sección Menú Principal</CardTitle>
                  <CardDescription>Fondo para productos del menú</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Imagen de fondo</Label>
                    <div className="mt-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                      <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Sube una imagen de fondo</p>
                    </div>
                  </div>

                  <div>
                    <Label>Color de fondo</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={storeConfig.backgrounds?.menu?.color || "#f9fafb"}
                        onChange={(e) => updateBackground('menu', { color: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                      <Input 
                        value={storeConfig.backgrounds?.menu?.color || "#f9fafb"}
                        onChange={(e) => updateBackground('menu', { color: e.target.value })}
                        placeholder="#f9fafb"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Opacidad del overlay: {Math.round((storeConfig.backgrounds?.menu?.overlay || 0.05) * 100)}%</Label>
                    <Slider
                      value={[(storeConfig.backgrounds?.menu?.overlay || 0.05) * 100]}
                      onValueChange={([opacity]) => updateBackground('menu', { overlay: opacity / 100 })}
                      max={100}
                      step={10}
                      className="w-full mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de UI */}
          <TabsContent value="ui">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Interfaz</CardTitle>
                <CardDescription>Personaliza cómo se ve tu tienda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Estilo de tarjetas</Label>
                    <Select 
                      value={storeConfig.ui?.cardStyle || "detailed"}
                      onValueChange={(value) => updateUI('cardStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimalista</SelectItem>
                        <SelectItem value="detailed">Detallado</SelectItem>
                        <SelectItem value="compact">Compacto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tamaño de imagen</Label>
                    <Select 
                      value={storeConfig.ui?.productImageSize || "medium"}
                      onValueChange={(value) => updateUI('productImageSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeño</SelectItem>
                        <SelectItem value="medium">Mediano</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Layout de productos</Label>
                    <Select 
                      value={storeConfig.ui?.layout || "grid"}
                      onValueChange={(value) => updateUI('layout', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Cuadrícula</SelectItem>
                        <SelectItem value="list">Lista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Bordes redondeados</Label>
                    <Select 
                      value={storeConfig.branding?.borderRadius || "md"}
                      onValueChange={(value) => updateBranding('borderRadius', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Pequeño</SelectItem>
                        <SelectItem value="md">Mediano</SelectItem>
                        <SelectItem value="lg">Grande</SelectItem>
                        <SelectItem value="xl">Extra Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="showPrices"
                      checked={storeConfig.ui?.showPrices ?? true}
                      onCheckedChange={(checked) => updateUI('showPrices', checked)}
                    />
                    <Label htmlFor="showPrices">Mostrar precios</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="showDescriptions"
                      checked={storeConfig.ui?.showDescriptions ?? true}
                      onCheckedChange={(checked) => updateUI('showDescriptions', checked)}
                    />
                    <Label htmlFor="showDescriptions">Mostrar descripciones</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña de Contacto */}
          <TabsContent value="contact">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                  <CardDescription>Configura los canales de comunicación con tus clientes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Mensaje de bienvenida</Label>
                    <Textarea 
                      value={storeConfig.contact?.welcomeMessage || ""}
                      onChange={(e) => updateConfig('contact', { ...storeConfig.contact, welcomeMessage: e.target.value })}
                      placeholder="Escribe un mensaje de bienvenida personalizado..."
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input 
                        value={storeConfig.contact?.email || ""}
                        onChange={(e) => updateConfig('contact', { ...storeConfig.contact, email: e.target.value })}
                        placeholder="contacto@tienda.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <Label>Sitio web</Label>
                      <Input 
                        value={storeConfig.contact?.website || ""}
                        onChange={(e) => updateConfig('contact', { ...storeConfig.contact, website: e.target.value })}
                        placeholder="https://www.tienda.com"
                        type="url"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Redes Sociales</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>WhatsApp</Label>
                        <Input 
                          value={storeConfig.contact?.socialMedia?.whatsapp || ""}
                          onChange={(e) => updateConfig('contact', { 
                            ...storeConfig.contact, 
                            socialMedia: { ...storeConfig.contact?.socialMedia, whatsapp: e.target.value }
                          })}
                          placeholder="5491234567890"
                        />
                      </div>
                      <div>
                        <Label>Instagram</Label>
                        <Input 
                          value={storeConfig.contact?.socialMedia?.instagram || ""}
                          onChange={(e) => updateConfig('contact', { 
                            ...storeConfig.contact, 
                            socialMedia: { ...storeConfig.contact?.socialMedia, instagram: e.target.value }
                          })}
                          placeholder="@tu_tienda"
                        />
                      </div>
                      <div>
                        <Label>Facebook</Label>
                        <Input 
                          value={storeConfig.contact?.socialMedia?.facebook || ""}
                          onChange={(e) => updateConfig('contact', { 
                            ...storeConfig.contact, 
                            socialMedia: { ...storeConfig.contact?.socialMedia, facebook: e.target.value }
                          })}
                          placeholder="TuTienda"
                        />
                      </div>
                      <div>
                        <Label>Twitter</Label>
                        <Input 
                          value={storeConfig.contact?.socialMedia?.twitter || ""}
                          onChange={(e) => updateConfig('contact', { 
                            ...storeConfig.contact, 
                            socialMedia: { ...storeConfig.contact?.socialMedia, twitter: e.target.value }
                          })}
                          placeholder="@tu_tienda"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ubicación</CardTitle>
                  <CardDescription>Configura la ubicación de tu tienda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Dirección</Label>
                    <Input 
                      value={storeConfig.location?.address || ""}
                      onChange={(e) => updateConfig('location', { ...storeConfig.location, address: e.target.value })}
                      placeholder="Calle 123, Ciudad, País"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Latitud</Label>
                      <Input 
                        value={storeConfig.location?.latitude || ""}
                        onChange={(e) => updateConfig('location', { ...storeConfig.location, latitude: parseFloat(e.target.value) || 0 })}
                        placeholder="-34.6037"
                        type="number"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label>Longitud</Label>
                      <Input 
                        value={storeConfig.location?.longitude || ""}
                        onChange={(e) => updateConfig('location', { ...storeConfig.location, longitude: parseFloat(e.target.value) || 0 })}
                        placeholder="-58.3816"
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="showMap"
                      checked={storeConfig.location?.showMap || false}
                      onCheckedChange={(checked) => updateConfig('location', { ...storeConfig.location, showMap: checked })}
                    />
                    <Label htmlFor="showMap">Mostrar mapa en la tienda</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de Horarios */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Horarios de Atención</CardTitle>
                <CardDescription>Configura los horarios de apertura y cierre por día</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(storeConfig.schedule || {}).map(([day, schedule]) => (
                  <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-20">
                        <Label className="capitalize">
                          {day === 'monday' && 'Lunes'}
                          {day === 'tuesday' && 'Martes'}
                          {day === 'wednesday' && 'Miércoles'}
                          {day === 'thursday' && 'Jueves'}
                          {day === 'friday' && 'Viernes'}
                          {day === 'saturday' && 'Sábado'}
                          {day === 'sunday' && 'Domingo'}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={!schedule.closed}
                          onCheckedChange={(checked) => updateConfig('schedule', {
                            ...storeConfig.schedule,
                            [day]: { ...schedule, closed: !checked }
                          })}
                        />
                        <Label>Abierto</Label>
                      </div>
                    </div>

                    {!schedule.closed && (
                      <div className="flex items-center space-x-2">
                        <div>
                          <Label className="text-xs">Apertura</Label>
                          <Input 
                            type="time"
                            value={schedule.open}
                            onChange={(e) => updateConfig('schedule', {
                              ...storeConfig.schedule,
                              [day]: { ...schedule, open: e.target.value }
                            })}
                            className="w-24"
                          />
                        </div>
                        <span className="text-muted-foreground">-</span>
                        <div>
                          <Label className="text-xs">Cierre</Label>
                          <Input 
                            type="time"
                            value={schedule.close}
                            onChange={(e) => updateConfig('schedule', {
                              ...storeConfig.schedule,
                              [day]: { ...schedule, close: e.target.value }
                            })}
                            className="w-24"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
