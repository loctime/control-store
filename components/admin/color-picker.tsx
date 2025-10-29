"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  placeholder?: string
}

export function ColorPicker({ label, value, onChange, placeholder }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border cursor-pointer"
        />
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "#000000"}
          className="flex-1"
        />
      </div>
    </div>
  )
}
