"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast-provider";
import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { useFeedbackWidget } from "./FeedbackWidgetContext";
import type { FeedbackCategory } from "@sass-store/validation/src/feedback";

type Category = FeedbackCategory;

const categoryLabels: Record<Category, string> = {
  opinion: "Opinión",
  sugerencia: "Sugerencia",
  problema: "Problema",
};

export function FeedbackWidget() {
  const {
    isOpen,
    open,
    close,
    initialCategory,
    initialContext,
    initialMessage,
    isErrorPage,
  } = useFeedbackWidget();
  const [category, setCategory] = useState<Category>(initialCategory);
  const [message, setMessage] = useState(initialMessage);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const tenantSlug = useTenantSlug();
  const { showToast } = useToast();

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      showToast("El mensaje debe tener al menos 10 caracteres", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantSlug ? { "x-tenant": tenantSlug } : {}),
        },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email || undefined,
          route: pathname,
          context: initialContext,
        }),
      });

      const data = await response.json().catch(() => ({
        success: false,
        error: { message: "Error inesperado" },
      }));

      if (response.ok && data.success) {
        showToast(data.data?.message || "Gracias por tu feedback", "success");
        setMessage("");
        setEmail("");
        close();
      } else {
        showToast(
          data.error?.message || "No se pudo enviar el feedback",
          "error",
        );
      }
    } catch {
      showToast("Error de conexión. Inténtalo más tarde.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showFloatingButton = !isOpen && !isErrorPage;

  return (
    <>
      {showFloatingButton && (
        <button
          onClick={() => open()}
          aria-label="Abrir feedback"
          aria-expanded={isOpen}
          className="fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground hover:opacity-90 rounded-full p-4 shadow-lg transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          data-testid="feedback-widget-panel"
          className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-card text-card-foreground rounded-lg shadow-xl border border-border overflow-hidden"
        >
          <div className="bg-primary text-primary-foreground px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold">Tu opinión nos ayuda a mejorar</h3>
            <button
              onClick={() => close()}
              aria-label="Cerrar feedback"
              className="text-primary-foreground hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring rounded p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="flex gap-2">
              {(Object.keys(categoryLabels) as Category[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex-1 py-2 px-2 text-sm rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    category === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {categoryLabels[key]}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cuéntanos qué piensas o qué problema encontraste..."
              rows={4}
              aria-label="Mensaje de feedback"
              className="w-full p-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
              required
              minLength={10}
              maxLength={2000}
            />

            {!session?.user?.email && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email (opcional)"
                aria-label="Email opcional"
                className="w-full p-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
              />
            )}

            <button
              type="submit"
              disabled={loading || message.trim().length < 10}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium py-2 px-4 rounded-md transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {loading ? "Enviando..." : "Enviar feedback"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
