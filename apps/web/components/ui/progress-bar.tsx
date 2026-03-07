"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  color,
  showLabel = true,
  labelPosition = "inside",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Determinar color basado en porcentaje si no se especifica
  const getBarColor = () => {
    if (color) return color;
    if (percentage >= 100) return "bg-red-600";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 50) return "bg-stone-500";
    return "bg-green-500";
  };

  const sizeClasses = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1">
        {showLabel && labelPosition === "outside" && (
          <span className="text-sm font-medium text-gray-700">
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>

      <div
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            getBarColor(),
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {showLabel && labelPosition === "inside" && size !== "sm" && (
            <span className="flex items-center justify-center h-full text-xs font-semibold text-white px-2">
              {percentage >= 15 ? `${Math.round(percentage)}%` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Versión con información adicional
interface ProgressBarWithInfoProps extends ProgressBarProps {
  label?: string;
  current: number | string;
  total: number | string;
  currency?: string;
}

export function ProgressBarWithInfo({
  value,
  max = 100,
  label,
  current,
  total,
  currency = "$",
  size = "md",
  color,
  className,
}: ProgressBarWithInfoProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val;
    return `${currency}${val.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || current !== undefined) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900">
              {formatValue(current)}
            </span>
            <span className="text-sm text-gray-500 mx-1">/</span>
            <span className="text-sm text-gray-500">{formatValue(total)}</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      <ProgressBar
        value={value}
        max={max}
        size={size}
        color={color}
        showLabel={false}
      />
    </div>
  );
}
