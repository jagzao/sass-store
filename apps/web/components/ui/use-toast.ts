"use client";

import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "destructive";

export interface ToastInput {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
}

type ToastId = string | number;

type ToastFn = ((input: ToastInput | ReactNode) => ToastId) & {
  success: (message: ReactNode, description?: ReactNode) => ToastId;
  error: (message: ReactNode, description?: ReactNode) => ToastId;
  warning: (message: ReactNode, description?: ReactNode) => ToastId;
  info: (message: ReactNode, description?: ReactNode) => ToastId;
};

const toast = ((input: ToastInput | ReactNode) => {
  if (
    typeof input === "string" ||
    typeof input === "number" ||
    input === null ||
    input === undefined
  ) {
    return sonnerToast(input ?? "");
  }

  if (typeof input === "object" && "title" in input) {
    const { title, description, variant } = input;
    const message = title ?? "";
    const options = description ? { description } : undefined;

    switch (variant) {
      case "success":
        return sonnerToast.success(message, options);
      case "error":
      case "destructive":
        return sonnerToast.error(message, options);
      case "warning":
        return sonnerToast.warning(message, options);
      case "info":
        return sonnerToast.info(message, options);
      default:
        return sonnerToast(message, options);
    }
  }

  return sonnerToast(input as ReactNode);
}) as ToastFn;

toast.success = (message: ReactNode, description?: ReactNode) =>
  sonnerToast.success(message, description ? { description } : undefined);

toast.error = (message: ReactNode, description?: ReactNode) =>
  sonnerToast.error(message, description ? { description } : undefined);

toast.warning = (message: ReactNode, description?: ReactNode) =>
  sonnerToast.warning(message, description ? { description } : undefined);

toast.info = (message: ReactNode, description?: ReactNode) =>
  sonnerToast.info(message, description ? { description } : undefined);

export function useToast() {
  return { toast };
}

export { toast };
