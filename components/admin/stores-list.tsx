"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { getAllStores, deleteStoreCompletely, updateStoreOwner, createTransferLink } from "@/lib/stores"
import type { Store } from "@/lib/types"
import { Edit, Trash2, ExternalLink, Calendar, User, Mail, Link, Copy } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface StoresListProps {
  onStoreUpdate?: () => void
}

export function StoresList({ onStoreUpdate }: StoresListProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [transferLink, setTransferLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const loadStores = async () => {
    try {
      setIsLoading(true)
      const storesData = await getAllStores()
      setStores(storesData)
    } catch (error) {
      console.error("Error cargando tiendas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las tiendas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleEditStore = (store: Store) => {
    setEditingStore(store)
    setTransferLink("")
    setIsEditDialogOpen(true)
  }

  const handleGenerateTransferLink = async () => {
    if (!editingStore) return

    try {
      setIsGeneratingLink(true)
      const link = await createTransferLink(editingStore.id)
      setTransferLink(link)
      toast({
        title: "Link generado",
        description: "Link de transferencia creado exitosamente",
      })
    } catch (error) {
      console.error("Error generando link:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el link de transferencia",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(transferLink)
    toast({
      title: "Copiado",
      description: "Link copiado al portapapeles",
    })
  }

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    try {
      await deleteStoreCompletely(storeId)
      toast({
        title: "Éxito",
        description: `Tienda "${storeName}" y todos sus datos eliminados correctamente`,
      })
      loadStores()
      onStoreUpdate?.()
    } catch (error) {
      console.error("Error eliminando tienda:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la tienda completamente",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return dateObj.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "N/A"
    }
  }

  const getStoreUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tiendas</CardTitle>
          <CardDescription>Lista de todas las tiendas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando tiendas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tiendas ({stores.length})</CardTitle>
          <CardDescription>Gestiona todas las tiendas registradas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Dueño</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay tiendas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {store.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{store.ownerEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{store.ownerId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={getStoreUrl(store.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver tienda
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(store.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditStore(store)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar tienda completamente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente:
                                  <br />• La tienda "{store.name}"
                                  <br />• Todos los productos
                                  <br />• Todas las categorías
                                  <br />• La configuración de Google Sheets
                                  <br />• Se removerá del usuario dueño
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStore(store.id, store.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para transferir tienda */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir tienda</DialogTitle>
            <DialogDescription>
              Genera un link para transferir la tienda "{editingStore?.name}" a un nuevo dueño
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">Dueño actual</Label>
              </div>
              <p className="text-sm text-muted-foreground">{editingStore?.ownerEmail}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Link de transferencia</Label>
                  <p className="text-sm text-muted-foreground">
                    Comparte este link con el nuevo dueño para transferir la tienda
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateTransferLink}
                  disabled={isGeneratingLink}
                  size="sm"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {isGeneratingLink ? "Generando..." : "Generar Link"}
                </Button>
              </div>

              {transferLink && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={transferLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Este link expira en 24 horas. La transferencia incluirá automáticamente la configuración de Google Sheets.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
