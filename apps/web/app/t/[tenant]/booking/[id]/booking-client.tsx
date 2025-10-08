"use client";

import { useState } from "react";

interface BookingClientProps {
  tenantData: {
    id: string;
    slug: string;
    name: string;
    branding: {
      primaryColor: string;
    };
    staff: Array<{
      id: string;
      name: string;
      role: string;
      specialties: string[];
      metadata?: any;
    }>;
  };
  serviceId: string;
}

export function BookingClient({ tenantData, serviceId }: BookingClientProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock service data - in production this would come from database
  const service = {
    id: serviceId,
    name: "Gel Manicure",
    price: 44.0,
    duration: 60,
    description:
      "Manicura con gel de larga duración que mantiene tus uñas perfectas por semanas.",
    image: "✨",
  };

  // Use the specialist from tenant data
  const specialist = tenantData.staff[0] || {
    id: "1",
    name: "Marialicia Villafuerte H.",
    role: "Senior Nail Technician",
    specialties: ["Gel nails", "Acrylic", "Nail art"],
    metadata: { experience: "8 years" },
  };

  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, "");

    // Apply Mexican phone format: +52 XXX XXX XXXX
    if (cleaned.length <= 10) {
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        return `+52 ${match[1]}${match[2] ? " " + match[2] : ""}${match[3] ? " " + match[3] : ""}`.trim();
      }
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerInfo((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTime || !customerInfo.name || !customerInfo.phone) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock booking submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert(`¡Reserva confirmada!

Servicio: ${service.name}
Especialista: ${specialist.name}
Fecha: ${selectedDate}
Hora: ${selectedTime}
Cliente: ${customerInfo.name}
Teléfono: ${customerInfo.phone}

Te enviaremos una confirmación por SMS.`);

      // Reset form
      setSelectedTime("");
      setSelectedDate("");
      setCustomerInfo({
        name: "",
        phone: "",
        email: "",
        notes: "",
      });
    } catch (error) {
      console.error("Booking error:", error);
      alert("Error al crear la reserva. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reservar Cita</h1>
          <p className="text-gray-600 mt-2">
            Agenda tu cita para {service.name}
          </p>
        </div>

        {/* Booking Form */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{service.image}</div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {service.name}
              </h2>
              <p className="text-gray-600 mt-2">{service.description}</p>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Duración:</span>
                <span className="font-medium">{service.duration} minutos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio:</span>
                <span className="font-semibold text-green-600">
                  ${service.price}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incluye:</span>
                <span className="font-medium">Limado, cutículas, gel</span>
              </div>
            </div>

            {/* Staff Selection */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Especialista</h3>
              <div className="space-y-2">
                <div className="flex items-center p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span>👩‍🎨</span>
                    </div>
                    <div>
                      <div className="font-medium">{specialist.name}</div>
                      <div className="text-sm text-gray-500">
                        {specialist.role}
                      </div>
                      <div className="text-sm text-gray-500">
                        {specialist.metadata?.experience}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Date & Time Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              Selecciona Fecha y Hora
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horario Disponible *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSlotClick(time)}
                      className={`p-2 border rounded-md text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? "bg-blue-500 text-white border-blue-500"
                          : "hover:bg-blue-50 cursor-pointer"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {selectedTime && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Horario seleccionado: {selectedTime}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={handlePhoneChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+52 555 123 4567"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: +52 XXX XXX XXXX
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Alguna preferencia especial..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedTime ||
                  !customerInfo.name ||
                  !customerInfo.phone
                }
                className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: tenantData.branding.primaryColor }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmando reserva...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📅</span>
                    Confirmar Reserva
                  </>
                )}
              </button>
            </form>

            {/* Cancellation Policy */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                Política de Cancelación
              </h4>
              <p className="text-sm text-yellow-700">
                Puedes cancelar o reprogramar tu cita hasta 4 horas antes sin
                costo adicional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
