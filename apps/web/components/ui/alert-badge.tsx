"use client";

import { AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "warning" | "error" | "success" | "info";

interface AlertBadgeProps {
  type?: AlertType;
  message?: string;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AlertBadge({
  type = "warning",
  message,
  showIcon = true,
  className,
  size = "md",
}: AlertBadgeProps) {
  const config = {
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-orange-100",
      textColor: "text-orange-800",
      borderColor: "border-orange-200",
      label: "Alerta",
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      borderColor: "border-red-200",
      label: "Error",
    },
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      borderColor: "border-green-200",
      label: "Éxito",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
      label: "Info",
    },
  };

  const { icon: Icon, bgColor, textColor, borderColor, label } = config[type];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        sizeClasses[size],
        bgColor,
        textColor,
        borderColor,
        className,
      )}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      {message || label}
    </span>
  );
}

// Badge específico para presupuestos
interface BudgetAlertBadgeProps {
  percentage: number;
  threshold?: number;
  className?: string;
}

export function BudgetAlertBadge({
  percentage,
  threshold = 80,
  className,
}: BudgetAlertBadgeProps) {
  if (percentage >= 100) {
    return (
      <AlertBadge
        type="error"
        message="Presupuesto excedido"
        className={className}
      />
    );
  }

  if (percentage >= threshold) {
    return (
      <AlertBadge
        type="warning"
        message={`${percentage.toFixed(0)}% usado`}
        className={className}
      />
    );
  }

  if (percentage >= 50) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
        {percentage.toFixed(0)}% usado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {percentage.toFixed(0)}% usado
    </span>
  );
}

// Badge para estado de presupuesto
interface BudgetStatusBadgeProps {
  status: "active" | "paused" | "completed" | "cancelled";
  className?: string;
}

export function BudgetStatusBadge({
  status,
  className,
}: BudgetStatusBadgeProps) {
  const config = {
    active: {
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      label: "Activo",
    },
    paused: {
      bgColor: "bg-stone-100",
      textColor: "text-stone-800",
      label: "Pausado",
    },
    completed: {
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      label: "Completado",
    },
    cancelled: {
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      label: "Cancelado",
    },
  };

  const { bgColor, textColor, label } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        bgColor,
        textColor,
        className,
      )}
    >
      {label}
    </span>
  );
}
