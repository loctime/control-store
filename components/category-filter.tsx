"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { Category } from "@/lib/types"
import { Pizza, Utensils, GlassWater, Cake } from "lucide-react"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  pizza: Pizza,
  utensils: Utensils,
  "glass-water": GlassWater,
  cake: Cake,
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 p-1">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onSelectCategory(null)}
          className="flex-shrink-0"
        >
          Todos
        </Button>
        {categories.map((category) => {
          const Icon = category.icon ? iconMap[category.icon] : null
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => onSelectCategory(category.id)}
              className="flex-shrink-0"
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {category.name}
            </Button>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
