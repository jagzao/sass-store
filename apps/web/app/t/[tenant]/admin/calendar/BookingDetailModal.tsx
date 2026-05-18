"use client";

import { useCallback, useEffect, useState } from "react";
import { X, UserPlus, Link2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { buildRescheduleWhatsAppLink } from "@/lib/home/whatsapp-reschedule";

interface CustomerMatch {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  reasons: string[];
}

interface BookingDetailModalProps {
  bookingId: string | null;
  tenantSlug: string;
  tenantName: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export function BookingDetailModal({
  bookingId,
  tenantSlug,
  tenantName,
  onClose,
  onUpdated,
}: BookingDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [linking, setLinking] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/bookings/${bookingId}`,
      );
      if (!res.ok) throw new Error("No se pudo cargar la cita");
      const json = await res.json();
      setBooking(json.data);

      if (!json.data?.customerId) {
        const params = new URLSearchParams();
        if (json.data.customerName) params.set("name", json.data.customerName);
        if (json.data.customerEmail)
          params.set("email", json.data.customerEmail);
        if (json.data.customerPhone)
          params.set("phone", json.data.customerPhone);

        const matchRes = await fetch(
          `/api/tenants/${tenantSlug}/customers/match?${params}`,
        );
        if (matchRes.ok) {
          const matchJson = await matchRes.json();
          setMatches(matchJson.data?.matches ?? []);
        }
      } else {
        setMatches([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [bookingId, tenantSlug, onClose]);

  useEffect(() => {
    if (bookingId) load();
    else setBooking(null);
  }, [bookingId, load]);

  const linkCustomer = async (customerId: string) => {
    if (!bookingId) return;
    setLinking(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/bookings/${bookingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId }),
        },
      );
      if (!res.ok) throw new Error("No se pudo vincular");
      toast.success("Cliente vinculado a la cita");
      onUpdated?.();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLinking(false);
    }
  };

  const createCustomer = async () => {
    if (!booking) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: booking.customerName,
          email: booking.customerEmail || undefined,
          phone: booking.customerPhone || "",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "No se pudo crear el cliente");
      }
      const json = await res.json();
      const newId = json.customer?.id ?? json.data?.id;
      if (!newId) throw new Error("Respuesta inválida");
      await linkCustomer(newId);
      toast.success("Cliente creado y vinculado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  if (!bookingId) return null;

  const startTime = booking?.startTime
    ? new Date(String(booking.startTime))
    : null;
  const phone = String(booking?.customerPhone ?? "");
  const serviceName =
    (booking?.service as { name?: string })?.name ?? "Servicio";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      data-testid="booking-detail-modal"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#C5A059] uppercase tracking-wide">
            Detalle de cita
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !booking ? (
          <p className="p-8 text-center text-gray-500 text-sm">Cargando…</p>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Cliente
              </p>
              <p className="text-lg font-semibold text-[#333333]">
                {String(booking.customerName)}
              </p>
              {phone ? <p className="text-sm text-gray-600">{phone}</p> : null}
              {booking.customerEmail ? (
                <p className="text-sm text-gray-600">
                  {String(booking.customerEmail)}
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Servicio
              </p>
              <p className="text-sm font-medium text-[#333333]">
                {serviceName}
              </p>
            </div>

            {startTime ? (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Horario
                </p>
                <p className="text-sm text-[#333333]">
                  {startTime.toLocaleString("es-MX", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Estado
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                {String(booking.status)}
              </span>
            </div>

            {booking.customerId ? (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                Vinculada al expediente del cliente.
              </p>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
                <p className="text-sm text-amber-900 font-medium">
                  Sin cliente vinculado
                </p>
                <p className="text-xs text-amber-800/90">
                  Puede ser una clienta sin cuenta. Vincúlala o créala en el
                  expediente.
                </p>

                {matches.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase">
                      ¿Es alguna de estas?
                    </p>
                    {matches.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={linking}
                        onClick={() => linkCustomer(m.id)}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg border border-[#C5A059]/30 bg-white hover:bg-[#C5A059]/5 text-sm"
                      >
                        <Link2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                        <span>
                          <span className="font-medium text-[#333333]">
                            {m.name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            Coincide por: {m.reasons.join(", ")}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={createCustomer}
                  disabled={creating || linking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C5A059] text-white text-sm font-semibold hover:bg-[#B08D45] disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {creating ? "Creando…" : "Crear como nueva clienta"}
                </button>
              </div>
            )}

            {phone && startTime ? (
              <a
                href={buildRescheduleWhatsAppLink({
                  phone,
                  customerName: String(booking.customerName),
                  tenantName,
                  serviceName,
                  previousStart: startTime,
                  newStart: startTime,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#C5A059] text-[#C5A059] text-sm font-medium hover:bg-[#C5A059]/5"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar WhatsApp
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
