"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTenantSlug } from "@/lib/tenant/client-resolver";

interface FeedbackItem {
  id: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  context?: Record<string, unknown>;
  email?: string | null;
}

export default function AdminFeedbackPage() {
  const { data: session } = useSession();
  const tenantSlug = useTenantSlug();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = session?.user;
    if (!tenantSlug || !user?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/feedback`);
        const data = await response.json().catch(() => ({
          success: false,
          error: { message: "Respuesta inválida" },
        }));

        if (response.ok && data.success) {
          setItems(data.data.items ?? []);
        } else {
          setError(data.error?.message || "No se pudo cargar el feedback");
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantSlug, session?.user]);

  const categoryClass = (category: string) => {
    switch (category) {
      case "problema":
        return "bg-red-100 text-red-800";
      case "sugerencia":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "retrying":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8 min-h-screen bg-[#0D0D0D] text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Feedback de usuarios</h1>
        <p className="text-gray-400">
          Opiniones, sugerencias y problemas reportados por los usuarios.
        </p>
      </div>

      {loading && <div className="text-gray-400">Cargando feedback...</div>}

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-md">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-gray-400">No hay feedback registrado.</div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-[#121212] border border-white/10 rounded-lg p-4"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${categoryClass(
                  item.category,
                )}`}
              >
                {item.category}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(
                  item.status,
                )}`}
              >
                {item.status}
              </span>
              <span className="text-gray-500 text-sm ml-auto">
                {new Date(item.createdAt).toLocaleString("es-MX")}
              </span>
            </div>

            <p className="text-gray-200 whitespace-pre-wrap mb-2">
              {item.message}
            </p>

            {item.email && (
              <p className="text-sm text-gray-400">Email: {item.email}</p>
            )}

            {typeof item.context?.route === "string" && (
              <p className="text-sm text-gray-500 mt-2">
                Ruta: {item.context.route}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
