"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

// Paleta de colores predefinida
const COLOR_PALETTE = [
  { color: "#EF4444", name: "Rojo" }, // Rojo
  { color: "#F97316", name: "Naranja" }, // Naranja
  { color: "#F59E0B", name: "Ámbar" }, // Ámbar
  { color: "#84CC16", name: "Lima" }, // Lima
  { color: "#10B981", name: "Verde" }, // Verde
  { color: "#06B6D4", name: "Cyan" }, // Cyan
  { color: "#3B82F6", name: "Azul" }, // Azul
  { color: "#6366F1", name: "Índigo" }, // Índigo
  { color: "#8B5CF6", name: "Violeta" }, // Violeta
  { color: "#D946EF", name: "Fucsia" }, // Fucsia
  { color: "#EC4899", name: "Rosa" }, // Rosa
  { color: "#6B7280", name: "Gris" }, // Gris
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(
    value || COLOR_PALETTE[6].color,
  );

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-gray-700">Color</label>
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map((item) => (
          <button
            key={item.color}
            type="button"
            onClick={() => handleColorSelect(item.color)}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
              selectedColor === item.color
                ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                : "border-transparent hover:border-gray-300",
            )}
            style={{ backgroundColor: item.color }}
            title={item.name}
          >
            {selectedColor === item.color && (
              <Check className="w-4 h-4 text-white mx-auto" strokeWidth={3} />
            )}
          </button>
        ))}
      </div>

      {/* Input para color personalizado */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: selectedColor }}
        />
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => handleColorSelect(e.target.value)}
          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
        />
        <span className="text-sm text-gray-600 font-mono">
          {selectedColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
