"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StoreIcon, LogOut, Eye } from "lucide-react"

interface StoreAdminHeaderProps {
  storeName: string
  storeSlug: string
  onLogout: () => void
}

export function StoreAdminHeader({ storeName, storeSlug, onLogout }: StoreAdminHeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <StoreIcon className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">
                <span className="md:hidden">Admin</span>
                <span className="hidden md:inline">Panel de Administración</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{storeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button variant="outline" size="icon" className="sm:w-auto" asChild>
              <Link href={`/${storeSlug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Ver tienda</span>
              </Link>
            </Button>
            <Button variant="outline" size="icon" className="sm:w-auto" onClick={onLogout}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

