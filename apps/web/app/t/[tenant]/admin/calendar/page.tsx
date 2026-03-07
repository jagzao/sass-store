import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { CalendarSettings } from "./CalendarSettings";
import { db } from "@sass-store/database";
import { bookings, services } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import CalendarTimeline from "./CalendarTimeline";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Plus } from "lucide-react";

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

  const startOfWeek = currentWeek[0];
  const endOfWeek = new Date(currentWeek[6]);
  endOfWeek.setHours(23, 59, 59, 999);

  // Fetch real bookings from database
  const dbBookings = await db
    .select({
      id: bookings.id,
      serviceName: services.name,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      startTime: bookings.startTime,
      duration: services.duration,
      status: bookings.status,
      totalPrice: bookings.totalPrice,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.tenantId, tenantData.id)
      )
    );

  const mappedBookings = dbBookings.map((b) => {
    const dt = new Date(b.startTime);
    return {
      id: b.id,
      serviceName: b.serviceName,
      customerName: b.customerName,
      date: formatDate(dt),
      time: formatTime(dt),
      duration: b.duration,
      status: b.status,
      phone: b.customerPhone || "Sin teléfono",
      totalPrice: Number(b.totalPrice),
    };
  });



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

  return (
    <AdminLayoutProvider tenantSlug={resolvedParams.tenant}>
    <div className="min-h-screen bg-gray-50">
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
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 border-b-2">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[400px] p-0" sideOffset={8}>
                    <CalendarSettings />
                  </PopoverContent>
                </Popover>

                <button className="flex items-center px-4 py-2 bg-[#C5A059] text-white rounded-lg hover:bg-[#b08e4f] transition-colors shadow-sm font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cita
                </button>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-2xl font-bold text-blue-600">{mappedBookings.filter(b => b.date === formatDate(new Date())).length}</div>
              <div className="text-sm text-gray-600 font-medium tracking-wide uppercase mt-1">Citas Hoy</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-2xl font-bold text-green-600">{mappedBookings.filter(b => b.status === "confirmed").length}</div>
              <div className="text-sm text-gray-600 font-medium tracking-wide uppercase mt-1">Confirmadas</div>
            </div>
            <div className="bg-[#C5A059]/10 rounded-lg shadow-sm border border-[#C5A059]/20 p-6">
              <div className="text-2xl font-bold text-[#C5A059]">{mappedBookings.filter(b => b.status === "pending").length}</div>
              <div className="text-sm text-[#C5A059] font-medium tracking-wide uppercase mt-1">Pendientes</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="text-2xl font-bold text-red-600">{mappedBookings.filter(b => b.status === "cancelled").length}</div>
              <div className="text-sm text-gray-600 font-medium tracking-wide uppercase mt-1">Canceladas</div>
            </div>
          </div>

          <div className="w-full">
            {/* Calendar View Custom Grid (Cinema-Style) */}
            <div className="lg:col-span-4 max-w-full">
              <CalendarTimeline 
                initialBookings={mappedBookings}
                currentDate={today}
                tenantSlug={resolvedParams.tenant}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayoutProvider>
  );
}
