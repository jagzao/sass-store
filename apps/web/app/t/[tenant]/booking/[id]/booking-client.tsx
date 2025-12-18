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
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Set today's date as the default
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock service data - in production this would come from database
  const service = {
    id: serviceId,
    name: "Gel Manicure",
    price: 450.0, // Fixed: price > deposit
    duration: 60,
    description:
      "Manicura con gel de larga duración que mantiene tus uñas perfectas por semanas.",
    image: "✨",
  };

  const DEPOSIT_AMOUNT = 100; // MXN
  // VALIDATION: Deposit cannot exceed total price
  const safeDeposit = Math.min(DEPOSIT_AMOUNT, service.price);
  const remainingBalance = Math.max(service.price - safeDeposit, 0);

  // Use the specialist from tenant data
  const specialist = tenantData.staff[0] || {
    id: "1",
    name: "Marialicia Villafuerte H.",
    role: "Senior Nail Technician",
    specialties: ["Gel nails", "Acrylic", "Nail art"],
    metadata: { experience: "8 years" },
  };

  // Filter time slots based on current time if selected date is today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const currentTime = isToday ? new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0') : '00:00';
  
  const allTimeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  
  const timeSlots = isToday 
    ? allTimeSlots.filter(time => time > currentTime)
    : allTimeSlots;

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters except the + at the beginning
    const cleaned = value.replace(/[^\d+]/g, "");
    
    // If user is still typing +52, allow it
    if (cleaned === '+' || cleaned === '+5' || cleaned === '+52') {
      return cleaned;
    }

    // Remove the +52 prefix to work with the 10 digits
    let digits = cleaned;
    if (cleaned.startsWith('+52')) {
      digits = cleaned.substring(3);
    } else if (cleaned.startsWith('52')) {
      digits = cleaned.substring(2);
    } else if (cleaned.startsWith('5') && cleaned.length === 1) {
      return "+5";
    }
    
    // Limit to 10 digits max for Mexican numbers
    digits = digits.substring(0, 10);
    
    // Apply Mexican phone format: +52 XXX XXX XXXX
    if (digits.length > 0) {
      const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        let formatted = `+52 ${match[1]}`;
        if (match[2]) formatted += ` ${match[2]}`;
        if (match[3]) formatted += ` ${match[3]}`;
        return formatted.trim();
      }
    }
    
    return "+52 ";
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

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Por favor sube una imagen válida (JPG, PNG, etc.)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es muy grande. Máximo 5MB permitido.");
        return;
      }

      setPaymentProof(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTime || !customerInfo.name || !customerInfo.phone) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    if (!paymentProof) {
      alert(`Por favor sube el comprobante de pago del depósito de $${safeDeposit} MXN`);
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
      setPaymentProof(null);
      setPaymentProofPreview("");
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
                <span className="text-gray-600">Precio Total:</span>
                <span className="font-semibold text-green-600">
                  ${service.price} MXN
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">Depósito Requerido:</span>
                <span className="font-bold text-blue-600">
                  ${safeDeposit} MXN
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incluye:</span>
                <span className="font-medium">Limado, cutículas, gel</span>
              </div>
            </div>

            {/* Deposit Info */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">💳</span>
                Información de Pago
              </h4>
              <p className="text-sm text-blue-800 mb-2">
                <strong>Depósito requerido: ${safeDeposit} MXN</strong>
              </p>
              <p className="text-sm text-blue-700">
                Transferencia/depósito a la cuenta:
              </p>
              <div className="mt-2 p-2 bg-white rounded border border-blue-300 text-sm">
                <p><strong>Banco:</strong> BBVA</p>
                <p><strong>Cuenta:</strong> 1234 5678 9012 3456</p>
                <p><strong>CLABE:</strong> 012 180 0123 4567 8901 23</p>
                <p><strong>Titular:</strong> Wonder Nails Studio</p>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Después de realizar el depósito, sube tu comprobante de pago en el formulario.
              </p>
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
                    onKeyDown={(e) => {
                      // Allow backspace, delete, tab, escape, enter, and arrow keys
                      if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        return;
                      }
                      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                        return;
                      }
                      // Prevent all other non-digit characters except + at the beginning
                      if (!/[\d+]/.test(e.key) && e.key !== 'Unidentified') {
                        e.preventDefault();
                      }
                    }}
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

                {/* Payment Proof Upload */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Pago del Depósito (${safeDeposit} MXN) *
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-7">
                        {paymentProofPreview ? (
                          <div className="relative">
                            <img
                              src={paymentProofPreview}
                              alt="Comprobante de pago"
                              className="h-20 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setPaymentProof(null);
                                setPaymentProofPreview("");
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click para subir</span> o arrastra la imagen
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePaymentProofChange}
                        required
                      />
                    </label>
                  </div>
                  {paymentProof && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Comprobante cargado: {paymentProof.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedTime ||
                  !customerInfo.name ||
                  !customerInfo.phone ||
                  !paymentProof
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
                costo adicional. <strong>El depósito de ${safeDeposit} MXN es reembolsable</strong> si cancelas con al menos 4 horas de anticipación.
              </p>
            </div>

            {/* Deposit Note */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <span className="mr-2">💰</span>
                Sobre tu Depósito
              </h4>
              <p className="text-sm text-green-700">
                El depósito de <strong>${safeDeposit} MXN</strong> se aplicará al costo total del servicio. Pagarás el restante (<strong>${remainingBalance} MXN</strong>) el día de tu cita.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
