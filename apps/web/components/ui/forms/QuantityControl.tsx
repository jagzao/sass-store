"use client";

import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  label,
  size = "md",
}: QuantityControlProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (isNaN(newValue)) return;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  };

  const sizeClasses = {
    sm: "h-8 text-sm px-2",
    md: "h-10 text-base px-3",
    lg: "h-12 text-lg px-4",
  };

  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            "flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 transition-colors",
            buttonSizeClasses[size],
            (disabled || value <= min) && "opacity-50 cursor-not-allowed",
          )}
        >
          <Minus className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        </button>

        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          max={max}
          className={cn(
            "w-16 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            sizeClasses[size],
            disabled && "bg-gray-100 cursor-not-allowed",
          )}
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            "flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 transition-colors",
            buttonSizeClasses[size],
            (disabled || value >= max) && "opacity-50 cursor-not-allowed",
          )}
        >
          <Plus className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
        </button>
      </div>
    </div>
  );
}
