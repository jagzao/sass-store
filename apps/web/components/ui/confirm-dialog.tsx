"use client";

import * as React from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfirmVariant = "danger" | "warning" | "info";

interface ImpactItem {
  label: string;
  count?: number;
}

interface ConfirmDialogProps {
  /** The element that triggers the dialog (e.g. a delete icon button) */
  trigger: React.ReactNode;
  title: string;
  description: string;
  /** Optional highlighted name to show inside the description */
  subjectName?: string;
  /** Optional list of side-effects shown in the impact box */
  impactItems?: ImpactItem[];
  /** Label for the confirm/action button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Visual variant — affects icon and impact-box color */
  variant?: ConfirmVariant;
  /** Called when the user clicks the confirm button */
  onConfirm: () => void | Promise<void>;
  /** Optional loading state for async operations */
  loading?: boolean;
  /** Optional loading label override */
  loadingLabel?: string;
}

// ---------------------------------------------------------------------------
// Icon + color helpers
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    iconBg: string;
    icon: React.ElementType;
    impactBg: string;
    impactBorder: string;
    impactText: string;
    impactLabel: string;
    confirmBtn: string;
  }
> = {
  danger: {
    iconBg: "bg-red-100",
    icon: Trash2,
    impactBg: "bg-red-50",
    impactBorder: "border-red-200",
    impactText: "text-red-700",
    impactLabel: "text-red-800",
    confirmBtn:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  },
  warning: {
    iconBg: "bg-amber-100",
    icon: AlertTriangle,
    impactBg: "bg-amber-50",
    impactBorder: "border-amber-200",
    impactText: "text-amber-700",
    impactLabel: "text-amber-800",
    confirmBtn:
      "bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-500",
  },
  info: {
    iconBg: "bg-blue-100",
    icon: Info,
    impactBg: "bg-blue-50",
    impactBorder: "border-blue-200",
    impactText: "text-blue-700",
    impactLabel: "text-blue-800",
    confirmBtn:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  },
};

// ---------------------------------------------------------------------------
// ConfirmDialog component
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  trigger,
  title,
  description,
  subjectName,
  impactItems,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  loading = false,
  loadingLabel,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent className="max-w-md rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
        {/* Header band */}
        <div className="px-6 pt-6 pb-4">
          <AlertDialogHeader className="gap-3">
            {/* Icon */}
            <div
              className={cn(
                "mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0",
                config.iconBg,
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  variant === "danger"
                    ? "text-red-600"
                    : variant === "warning"
                      ? "text-amber-600"
                      : "text-blue-600",
                )}
                strokeWidth={2}
              />
            </div>

            {/* Title */}
            <AlertDialogTitle className="text-[17px] font-semibold text-gray-900 leading-snug sm:text-lg">
              {title}
            </AlertDialogTitle>

            {/* Description */}
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
                <div>
                  {description}
                  {subjectName && (
                    <>
                      {" "}
                      <span className="font-semibold text-gray-700">
                        "{subjectName}"
                      </span>
                      .
                    </>
                  )}
                </div>

                {/* Impact box */}
                {impactItems && impactItems.length > 0 && (
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3 text-xs",
                      config.impactBg,
                      config.impactBorder,
                    )}
                  >
                    <span
                      className={cn(
                        "block font-semibold mb-1.5 text-[11px] uppercase tracking-wide",
                        config.impactLabel,
                      )}
                    >
                      También se eliminarán o desvincularán
                    </span>
                    <ul className="space-y-0.5">
                      {impactItems.map((item, i) => (
                        <li
                          key={i}
                          className={cn(
                            "flex items-center gap-2",
                            config.impactText,
                          )}
                        >
                          <span className="h-1 w-1 rounded-full bg-current shrink-0" />
                          {item.count !== undefined && (
                            <span className="font-bold tabular-nums">
                              {item.count}
                            </span>
                          )}
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="flex-row justify-end gap-2 bg-gray-50 px-6 py-4 border-t border-gray-100 sm:flex-row">
          <AlertDialogCancel
            className="h-9 rounded-lg border-gray-200 bg-white px-4 text-sm font-medium text-gray-600
                       shadow-sm hover:bg-gray-50 hover:text-gray-800 focus-visible:ring-gray-300"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-semibold shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-150",
              config.confirmBtn,
            )}
          >
            {loading ? (loadingLabel ?? "Procesando…") : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// useConfirm hook — imperative confirm for simple window.confirm replacements
// ---------------------------------------------------------------------------

interface UseConfirmOptions {
  title: string;
  description: string;
  subjectName?: string;
  impactItems?: ImpactItem[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loadingLabel?: string;
}

interface ConfirmState extends UseConfirmOptions {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
  loading: boolean;
}

/**
 * Imperative confirm dialog — drop-in replacement for window.confirm().
 *
 * Usage:
 *   const [ConfirmUI, confirm] = useConfirm();
 *   // In JSX: <ConfirmUI />
 *   // In handler:
 *   const ok = await confirm({ title: "¿Eliminar?", description: "Esta acción..." });
 *   if (ok) doDelete();
 */
export function useConfirm(): [
  React.FC,
  (options: UseConfirmOptions) => Promise<boolean>,
] {
  const [state, setState] = React.useState<ConfirmState>({
    open: false,
    resolve: null,
    loading: false,
    title: "",
    description: "",
  });

  const confirm = React.useCallback(
    (options: UseConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({ ...options, open: true, resolve, loading: false });
      });
    },
    [],
  );

  const handleConfirm = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    // Small tick so the loading state renders before resolving
    await new Promise((r) => setTimeout(r, 50));
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, loading: false, resolve: null }));
  }, [state]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state]);

  const config = VARIANT_CONFIG[state.variant ?? "danger"];
  const Icon = config.icon;

  const ConfirmUI: React.FC = React.useCallback(() => {
    if (!state.open) return null;
    return (
      <AlertDialog open={state.open} onOpenChange={(o) => !o && handleCancel()}>
        <AlertDialogContent className="max-w-md rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
          <div className="px-6 pt-6 pb-4">
            <AlertDialogHeader className="gap-3">
              <div
                className={cn(
                  "mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0",
                  config.iconBg,
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    (state.variant ?? "danger") === "danger"
                      ? "text-red-600"
                      : (state.variant ?? "danger") === "warning"
                        ? "text-amber-600"
                        : "text-blue-600",
                  )}
                  strokeWidth={2}
                />
              </div>
              <AlertDialogTitle className="text-[17px] font-semibold text-gray-900 leading-snug sm:text-lg">
                {state.title}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
                  <div>
                    {state.description}
                    {state.subjectName && (
                      <>
                        {" "}
                        <span className="font-semibold text-gray-700">
                          "{state.subjectName}"
                        </span>
                        .
                      </>
                    )}
                  </div>
                  {state.impactItems && state.impactItems.length > 0 && (
                    <div
                      className={cn(
                        "rounded-xl border px-4 py-3 text-xs",
                        config.impactBg,
                        config.impactBorder,
                      )}
                    >
                      <p
                        className={cn(
                          "font-semibold mb-1.5 text-[11px] uppercase tracking-wide",
                          config.impactLabel,
                        )}
                      >
                        También se eliminarán o desvincularán
                      </p>
                      <ul className="space-y-0.5">
                        {state.impactItems.map((item, i) => (
                          <li
                            key={i}
                            className={cn(
                              "flex items-center gap-2",
                              config.impactText,
                            )}
                          >
                            <span className="h-1 w-1 rounded-full bg-current shrink-0" />
                            {item.count !== undefined && (
                              <span className="font-bold tabular-nums">
                                {item.count}
                              </span>
                            )}
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row justify-end gap-2 bg-gray-50 px-6 py-4 border-t border-gray-100 sm:flex-row">
            <AlertDialogCancel
              onClick={handleCancel}
              className="h-9 rounded-lg border-gray-200 bg-white px-4 text-sm font-medium text-gray-600
                         shadow-sm hover:bg-gray-50 hover:text-gray-800"
            >
              {state.cancelLabel ?? "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={state.loading}
              className={cn(
                "h-9 rounded-lg px-4 text-sm font-semibold shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150",
                config.confirmBtn,
              )}
            >
              {state.loading
                ? (state.loadingLabel ?? "Procesando…")
                : (state.confirmLabel ?? "Confirmar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [state, config, handleCancel, handleConfirm]);

  return [ConfirmUI, confirm];
}
