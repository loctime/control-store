"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StoreIcon, LogOut } from "lucide-react"

interface StoreAdminHeaderProps {
  storeName: string
  storeSlug: string
  onLogout: () => void
}

export function StoreAdminHeader({ storeName, storeSlug, onLogout }: StoreAdminHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StoreIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">{storeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/${storeSlug}`} target="_blank" rel="noopener noreferrer">
                Ver tienda
              </Link>
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

