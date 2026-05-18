"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  PhoneCall,
  RefreshCw,
} from "lucide-react";
import AdminRouteGuard from "@/components/auth/AdminRouteGuard";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  googleEventId: string | null;
  notes: string | null;
  service: { name: string; duration: number | null };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border border-blue-200",
  completed: "bg-green-100 text-green-800 border border-green-200",
  cancelled: "bg-red-100 text-red-800 border border-red-200",
};

type FilterType = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "completed", label: "Completadas" },
  { key: "cancelled", label: "Canceladas" },
];

export default function AdminBookingsPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url =
        filter === "all"
          ? `/api/tenants/${tenantSlug}/bookings`
          : `/api/tenants/${tenantSlug}/bookings?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar citas");
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      setError("No se pudieron cargar las citas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const changeStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      const res = await fetch(`/api/tenants/${tenantSlug}/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showSuccess(
        `Cita ${STATUS_LABELS[status]?.toLowerCase() ?? status} exitosamente`,
      );
      await fetchBookings();
    } catch {
      setError("No se pudo actualizar el estado. Intenta de nuevo.");
    } finally {
      setUpdating(null);
    }
  };

  const convertToVisit = async (id: string) => {
    try {
      setUpdating(id);
      const res = await fetch(
        `/api/tenants/${tenantSlug}/bookings/${id}/convert-to-visit`,
        {
          method: "POST",
        },
      );
      if (!res.ok) throw new Error();
      showSuccess("Cita convertida a visita del cliente");
      await fetchBookings();
    } catch {
      setError("No se pudo convertir la cita. Intenta de nuevo.");
    } finally {
      setUpdating(null);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      setUpdating(id);
      const res = await fetch(`/api/tenants/${tenantSlug}/bookings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showSuccess("Cita eliminada");
      await fetchBookings();
    } catch {
      setError("No se pudo eliminar la cita.");
    } finally {
      setUpdating(null);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const countByStatus = (s: string) =>
    bookings.filter((b) => b.status === s).length;

  // counts from raw list (before filter)
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  useEffect(() => {
    if (filter === "all") setAllBookings(bookings);
  }, [bookings, filter]);

  return (
    <AdminLayoutProvider tenantSlug={tenantSlug}>
      <AdminRouteGuard tenantSlug={tenantSlug}>
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📋 Gestión de Citas
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Citas agendadas por clientes · {bookings.length}{" "}
                {filter === "all"
                  ? "en total"
                  : STATUS_LABELS[filter]?.toLowerCase()}
              </p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          </div>

          {/* Success / Error banners */}
          {successMsg && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 font-medium"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                data-testid={`filter-${key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label}
                {key !== "all" && (
                  <span
                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      filter === key
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {countByStatus(key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === "all"
                  ? "Aún no hay citas agendadas"
                  : `No hay citas ${STATUS_LABELS[filter]?.toLowerCase()}`}
              </h3>
              <p className="text-gray-500 text-sm">
                Las citas agendadas por los clientes en el formulario público
                aparecerán aquí.
              </p>
              <a
                href={`/t/${tenantSlug}/book`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Ver formulario de citas →
              </a>
            </div>
          ) : (
            <div className="space-y-3" data-testid="bookings-list">
              {bookings.map((booking) => {
                const busy = updating === booking.id;
                return (
                  <div
                    key={booking.id}
                    data-testid={`booking-card-${booking.id}`}
                    className={`bg-white rounded-xl border border-gray-200 p-5 transition-opacity ${busy ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left: customer + service */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">
                            {booking.customerName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {STATUS_LABELS[booking.status] ?? booking.status}
                          </span>
                          {booking.googleEventId && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Google Calendar
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-gray-700 mb-1">
                          🎯 {booking.service.name}
                          {booking.service.duration
                            ? ` · ${booking.service.duration} min`
                            : ""}
                        </p>

                        <p className="text-sm text-gray-500">
                          🕐 {formatDateTime(booking.startTime)}
                        </p>

                        {(booking.customerPhone || booking.customerEmail) && (
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            {booking.customerPhone && (
                              <a
                                href={`https://wa.me/52${booking.customerPhone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                              >
                                <PhoneCall className="h-3.5 w-3.5" />
                                {booking.customerPhone}
                              </a>
                            )}
                            {booking.customerEmail && (
                              <span className="text-gray-400">
                                {booking.customerEmail}
                              </span>
                            )}
                          </div>
                        )}

                        {booking.notes && (
                          <p className="mt-2 text-xs text-gray-400 italic">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>

                      {/* Right: price + actions */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="text-lg font-bold text-gray-900">
                          ${Number(booking.totalPrice).toFixed(2)}
                        </span>

                        <div className="flex flex-wrap gap-2 justify-end">
                          {booking.status === "pending" && (
                            <button
                              onClick={() =>
                                changeStatus(booking.id, "confirmed")
                              }
                              disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Confirmar
                            </button>
                          )}
                          {(booking.status === "pending" ||
                            booking.status === "confirmed") && (
                            <button
                              onClick={() =>
                                changeStatus(booking.id, "completed")
                              }
                              disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completar
                            </button>
                          )}
                          {booking.status === "completed" && (
                            <button
                              onClick={() => convertToVisit(booking.id)}
                              disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Clock className="h-3.5 w-3.5" />→ Visita
                            </button>
                          )}
                          {booking.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                changeStatus(booking.id, "cancelled")
                              }
                              disabled={busy}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancelar
                            </button>
                          )}
                          <ConfirmDialog
                            trigger={
                              <button
                                disabled={busy}
                                title="Eliminar cita"
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            }
                            title="¿Eliminar esta cita?"
                            description="Esta acción no se puede deshacer. Se eliminará la cita de"
                            subjectName={booking.customerName}
                            confirmLabel="Eliminar cita"
                            onConfirm={() => deleteBooking(booking.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminRouteGuard>
    </AdminLayoutProvider>
  );
}
