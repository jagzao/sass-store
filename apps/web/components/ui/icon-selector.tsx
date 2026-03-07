"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface IconSelectorProps {
  value?: string;
  onChange: (icon: string) => void;
  className?: string;
}

// Iconos útiles para categorías financieras
const ICON_OPTIONS = [
  { name: "Wallet", label: "Cartera" },
  { name: "CreditCard", label: "Tarjeta" },
  { name: "Banknote", label: "Efectivo" },
  { name: "PiggyBank", label: "Ahorro" },
  { name: "TrendingUp", label: "Ingreso" },
  { name: "TrendingDown", label: "Gasto" },
  { name: "DollarSign", label: "Dinero" },
  { name: "Coins", label: "Monedas" },
  { name: "Receipt", label: "Recibo" },
  { name: "FileText", label: "Documento" },
  { name: "Calculator", label: "Calculadora" },
  { name: "ChartPie", label: "Gráfico" },
  { name: "BarChart3", label: "Estadísticas" },
  { name: "Home", label: "Casa" },
  { name: "Car", label: "Auto" },
  { name: "Utensils", label: "Comida" },
  { name: "ShoppingCart", label: "Compras" },
  { name: "ShoppingBag", label: "Tienda" },
  { name: "Gift", label: "Regalo" },
  { name: "Heart", label: "Salud" },
  { name: "HeartPulse", label: "Médico" },
  { name: "GraduationCap", label: "Educación" },
  { name: "BookOpen", label: "Libros" },
  { name: "Plane", label: "Viaje" },
  { name: "Briefcase", label: "Trabajo" },
  { name: "Laptop", label: "Tecnología" },
  { name: "Smartphone", label: "Celular" },
  { name: "Zap", label: "Servicios" },
  { name: "Lightbulb", label: "Luz" },
  { name: "Droplets", label: "Agua" },
  { name: "Wifi", label: "Internet" },
  { name: "Phone", label: "Teléfono" },
  { name: "Film", label: "Entretenimiento" },
  { name: "Gamepad2", label: "Juegos" },
  { name: "Music", label: "Música" },
  { name: "Shirt", label: "Ropa" },
  { name: "Footprints", label: "Calzado" },
  { name: "Package", label: "Paquete" },
  { name: "Box", label: "Caja" },
  { name: "Truck", label: "Transporte" },
  { name: "Fuel", label: "Gasolina" },
  { name: "Bus", label: "Transporte público" },
  { name: "Stethoscope", label: "Doctor" },
  { name: "Pill", label: "Medicina" },
  { name: "MoreHorizontal", label: "Otros" },
  { name: "Circle", label: "General" },
];

export function IconSelector({
  value,
  onChange,
  className,
}: IconSelectorProps) {
  const [selectedIcon, setSelectedIcon] = useState(value || "Wallet");
  const [searchTerm, setSearchTerm] = useState("");

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    onChange(iconName);
  };

  const filteredIcons = ICON_OPTIONS.filter(
    (icon) =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Obtener el componente de icono dinámicamente
  const SelectedIconComponent = (Icons as any)[selectedIcon] || Icons.Wallet;

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-gray-700">Icono</label>

      {/* Icono seleccionado */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <SelectedIconComponent className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{selectedIcon}</p>
          <p className="text-xs text-gray-500">
            {ICON_OPTIONS.find((i) => i.name === selectedIcon)?.label ||
              "Icono personalizado"}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar icono..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Grid de iconos */}
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
        {filteredIcons.map((icon) => {
          const IconComponent = (Icons as any)[icon.name];
          if (!IconComponent) return null;

          return (
            <button
              key={icon.name}
              type="button"
              onClick={() => handleIconSelect(icon.name)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none",
                selectedIcon === icon.name
                  ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
              title={`${icon.label} (${icon.name})`}
            >
              <IconComponent className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {filteredIcons.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No se encontraron iconos con &quot;{searchTerm}&quot;
        </p>
      )}
    </div>
  );
}
