import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function CalendarAdminPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  // Only show calendar for booking-mode tenants
  if (tenantData.mode !== "booking") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Calendario no disponible
          </h2>
          <p className="text-gray-600 mb-4">
            Esta función solo está disponible para negocios con modo de
            reservas.
          </p>
          <a
            href={`/t/${resolvedParams.tenant}/admin`}
            className="text-indigo-600 hover:text-indigo-700"
          >
            ← Volver al Panel de Admin
          </a>
        </div>
      </div>
    );
  }

  // Mock bookings data
  const mockBookings = [
    {
      id: "book-001",
      serviceName: "Gel Manicure",
      customerName: "María González",
      date: "2024-09-24",
      time: "10:00",
      duration: 60,
      status: "confirmed",
      phone: "+52 55 1234-5678",
    },
    {
      id: "book-002",
      serviceName: "Classic Manicure",
      customerName: "Ana López",
      date: "2024-09-24",
      time: "14:30",
      duration: 45,
      status: "pending",
      phone: "+52 55 8765-4321",
    },
    {
      id: "book-003",
      serviceName: "Nail Art Design",
      customerName: "Sofia Martínez",
      date: "2024-09-25",
      time: "11:15",
      duration: 90,
      status: "confirmed",
      phone: "+52 55 9999-1111",
    },
  ];

  // Generate current week days
  const today = new Date();
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    return date;
  });

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav
        tenantInfo={{
          id: tenantData.id,
          name: tenantData.name,
          categories: [],
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <a
                    href={`/t/${resolvedParams.tenant}/admin`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    ← Panel Admin
                  </a>
                  <span className="text-gray-600">/</span>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Calendario
                  </h1>
                </div>
                <p className="text-gray-600 mt-2">
                  Administra citas, horarios y disponibilidad
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="mr-2">⚙️</span>
                  Configurar Horarios
                </button>
                <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <span className="mr-2">📅</span>
                  Nueva Cita
                </button>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Citas Hoy</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-600">Confirmadas</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-gray-600">Canceladas</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Calendar View */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Vista Semanal
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                      ←
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      {currentWeek[0].toLocaleDateString("es-ES")} -{" "}
                      {currentWeek[6].toLocaleDateString("es-ES")}
                    </span>
                    <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                      →
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day Headers */}
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                    (day, index) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    ),
                  )}

                  {/* Calendar Days */}
                  {currentWeek.map((date, index) => {
                    const dateStr = formatDate(date);
                    const dayBookings = mockBookings.filter(
                      (booking) => booking.date === dateStr,
                    );
                    const isToday = dateStr === formatDate(new Date());

                    return (
                      <div
                        key={index}
                        className={`min-h-32 p-2 border rounded-lg ${isToday ? "bg-indigo-50 border-indigo-200" : "border-gray-200"}`}
                      >
                        <div
                          className={`text-sm font-medium mb-2 ${isToday ? "text-indigo-600" : "text-gray-900"}`}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                              title={`${booking.customerName} - ${booking.serviceName}`}
                            >
                              {booking.time}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Horarios de Hoy
                  </h3>
                  <div className="grid gap-2">
                    {Array.from({ length: 10 }, (_, i) => {
                      const hour = 9 + i;
                      const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
                      const booking = mockBookings.find(
                        (b) =>
                          b.time === timeSlot &&
                          b.date === formatDate(new Date()),
                      );

                      return (
                        <div
                          key={timeSlot}
                          className="flex items-center p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="w-16 text-sm font-medium text-gray-600">
                            {timeSlot}
                          </div>
                          {booking ? (
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.customerName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {booking.serviceName}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                                >
                                  {getStatusText(booking.status)}
                                </span>
                                <button className="text-indigo-600 hover:text-indigo-700 text-xs">
                                  Editar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 text-center">
                              <button className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                                + Disponible
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Appointments */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Citas de Hoy
                </h3>
                <div className="space-y-3">
                  {mockBookings
                    .filter(
                      (booking) => booking.date === formatDate(new Date()),
                    )
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {booking.time}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                          >
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">
                          {booking.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.serviceName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.phone}
                        </div>
                        <div className="mt-2 flex space-x-2">
                          <button className="text-xs text-green-600 hover:text-green-700">
                            Confirmar
                          </button>
                          <button className="text-xs text-blue-600 hover:text-blue-700">
                            Editar
                          </button>
                          <button className="text-xs text-red-600 hover:text-red-700">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                    📅 Crear Nueva Cita
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                    ⚙️ Configurar Horarios
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                    🔒 Bloquear Horario
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                    📧 Enviar Recordatorios
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                    📊 Reporte Semanal
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración por defecto
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>30 minutos</option>
                      <option>45 minutos</option>
                      <option selected>60 minutos</option>
                      <option>90 minutos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buffer entre citas
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>Sin buffer</option>
                      <option selected>15 minutos</option>
                      <option>30 minutos</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Auto-confirmar
                      </div>
                      <div className="text-xs text-gray-500">
                        Confirmar citas automáticamente
                      </div>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Recordatorios SMS
                      </div>
                      <div className="text-xs text-gray-500">
                        Enviar 24h antes
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
