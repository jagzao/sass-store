"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast-provider";
import { useTenantSlug } from "@/lib/tenant/client-resolver";

type Category = "opinion" | "sugerencia" | "problema";

const categoryLabels: Record<Category, string> = {
  opinion: "Opinión",
  sugerencia: "Sugerencia",
  problema: "Problema",
};

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("opinion");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const tenantSlug = useTenantSlug();
  const { showToast } = useToast();

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email || undefined,
          route: pathname,
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
        setOpen(false);
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

  if (!tenantSlug) {
    return null;
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir feedback"
          className="fixed bottom-4 right-4 z-40 bg-[#FF8000] hover:bg-[#E67300] text-white rounded-full p-4 shadow-lg transition-colors"
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

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#FF8000] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold">Tu opinión nos ayuda a mejorar</h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar feedback"
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="flex gap-2">
              {(Object.keys(categoryLabels) as Category[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex-1 py-2 px-2 text-sm rounded-md border transition-colors ${
                    category === key
                      ? "bg-[#FF8000] text-white border-[#FF8000]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8000] text-gray-900"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8000] text-gray-900"
              />
            )}

            <button
              type="submit"
              disabled={loading || message.trim().length < 10}
              className="w-full bg-[#FF8000] hover:bg-[#E67300] disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? "Enviando..." : "Enviar feedback"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
