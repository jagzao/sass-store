"use client";

import { useState } from "react";
import AddEditVisitModal from "@/components/customers/AddEditVisitModal";
import { Check, Pencil, Plus, XCircle } from "lucide-react";

interface CalendarClientWrapperProps {
  todayBookings: any[];
  tenantSlug?: string;
}

export default function CalendarClientWrapper({
  todayBookings,
  tenantSlug,
}: CalendarClientWrapperProps) {
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [modalCustomerId, setModalCustomerId] = useState<string | undefined>(
    undefined,
  );
  const [modalDraft, setModalDraft] = useState<any | undefined>(undefined);
  const [editingVisit, setEditingVisit] = useState<any | null>(null);

  const toVisitStatus = (
    bookingStatus: string,
  ): "pending" | "scheduled" | "completed" | "cancelled" => {
    switch (bookingStatus) {
      case "confirmed":
        return "scheduled";
      case "pending":
      case "completed":
      case "cancelled":
        return bookingStatus;
      default:
        return "scheduled";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-stone-100 text-stone-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const resolveVisitForBooking = async (booking: any) => {
    if (!tenantSlug || !booking?.customerId) return null;

    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/customers/${booking.customerId}/visits`,
      );
      if (!response.ok) return null;

      const payload = await response.json();
      const visits = Array.isArray(payload?.visits) ? payload.visits : [];
      if (visits.length === 0) return null;

      const bookingStartMs = booking?.startTime
        ? new Date(booking.startTime).getTime()
        : Number.NaN;

      if (!Number.isNaN(bookingStartMs)) {
        const exactOrNear = visits.find((visit: any) => {
          const visitMs = new Date(visit.visitDate).getTime();
          return Math.abs(visitMs - bookingStartMs) <= 5 * 60 * 1000;
        });
        if (exactOrNear) return exactOrNear;
      }

      return null;
    } catch {
      return null;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            📋 CITAS DE HOY
          </h3>
          {tenantSlug && (
            <button
              onClick={() => {
                setModalCustomerId(undefined);
                setModalDraft(undefined);
                setEditingVisit(null);
                setShowAddVisitModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] text-white rounded-lg font-medium text-sm hover:bg-[#D4B76A] transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Visita</span>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {todayBookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-[#C5A059]/40 transition-colors bg-white relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{booking.time}</span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                >
                  {getStatusText(booking.status)}
                </span>
              </div>

              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm text-gray-900 font-semibold">
                    {booking.customerName}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {booking.serviceName}
                  </div>
                  {booking.totalPrice > 0 && (
                    <div className="text-xs text-[#C5A059] font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block mb-1">
                      Precio a Cobrar: $
                      {booking.totalPrice.toLocaleString("es-MX")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 flex-wrap justify-end">
                  <button
                    type="button"
                    title="Confirmar"
                    aria-label={`Confirmar cita de ${booking.customerName}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 shadow-sm transition-colors hover:bg-green-100"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Editar"
                    aria-label={`Editar cita de ${booking.customerName}`}
                    onClick={async () => {
                      setModalCustomerId(booking.customerId || undefined);

                      const linkedVisit = await resolveVisitForBooking(booking);
                      if (linkedVisit) {
                        setEditingVisit(linkedVisit);
                        setModalDraft(undefined);
                        setShowAddVisitModal(true);
                        return;
                      }

                      alert(
                        "No se encontró una visita vinculada para esta cita. Primero convierte o crea la visita desde el expediente de la clienta.",
                      );

                      setEditingVisit(null);
                      setModalDraft({
                        visitDate: booking.startTime,
                        notes: booking.notes || "",
                        status: toVisitStatus(booking.status),
                        services: [
                          {
                            serviceId: booking.serviceId || "",
                            serviceName: booking.serviceName || "Servicio",
                            description: "",
                            unitPrice: Number(booking.totalPrice) || 0,
                            quantity: 1,
                            subtotal: Number(booking.totalPrice) || 0,
                          },
                        ],
                        products: [],
                      });
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Cancelar"
                    aria-label={`Cancelar cita de ${booking.customerName}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 shadow-sm transition-colors hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {todayBookings.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No hay citas registradas para hoy.
            </div>
          )}
        </div>
      </div>

      {showAddVisitModal && tenantSlug && (
        <AddEditVisitModal
          tenantSlug={tenantSlug}
          customerId={modalCustomerId}
          visit={editingVisit}
          initialDraft={modalDraft}
          onClose={(shouldRefresh) => {
            setShowAddVisitModal(false);
            setModalCustomerId(undefined);
            setModalDraft(undefined);
            setEditingVisit(null);
            if (shouldRefresh) {
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}
