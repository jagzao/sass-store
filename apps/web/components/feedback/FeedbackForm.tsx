"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast-provider";
import type { FeedbackCategory } from "@sass-store/validation/src/feedback";

type Category = FeedbackCategory;

const categoryLabels: Record<Category, string> = {
  opinion: "Opinión",
  sugerencia: "Sugerencia",
  problema: "Problema",
};

interface FeedbackFormProps {
  initialCategory: Category;
  initialMessage: string;
  initialContext: Record<string, unknown>;
  onSubmitted: () => void;
}

export function FeedbackForm({
  initialCategory,
  initialMessage,
  initialContext,
  onSubmitted,
}: FeedbackFormProps) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [message, setMessage] = useState(initialMessage);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
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
        headers: { "Content-Type": "application/json" },
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
        onSubmitted();
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

  return (
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
  );
}
