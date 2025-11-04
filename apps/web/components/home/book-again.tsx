'use client';

import { useTenantSlug } from '@/lib/tenant/client-resolver';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  image: string;
  tenant: string;
  tenantName: string;
  preferredStaff: string;
  nextAvailableSlot: string;
  lastBooked: string;
}

const recentBookings: Service[] = [
  {
    id: '1',
    name: 'Classic Manicure',
    price: 35.00,
    duration: 45,
    image: '💅',
    tenant: 'wondernails',
    tenantName: 'Wonder Nails',
    preferredStaff: 'María',
    nextAvailableSlot: '14:30',
    lastBooked: '2024-01-15'
  },
  {
    id: '2',
    name: 'Cut & Style',
    price: 85.00,
    duration: 90,
    image: '✂️',
    tenant: 'vigistudio',
    tenantName: 'Vigi Studio',
    preferredStaff: 'Carmen',
    nextAvailableSlot: '16:00',
    lastBooked: '2024-01-10'
  },
  {
    id: '3',
    name: 'Court Rental',
    price: 45.00,
    duration: 60,
    image: '🎾',
    tenant: 'centro-tenistico',
    tenantName: 'Centro Tenístico',
    preferredStaff: 'Cancha 2',
    nextAvailableSlot: '18:00',
    lastBooked: '2024-01-08'
  },
  {
    id: '4',
    name: 'Tech Consultation',
    price: 150.00,
    duration: 60,
    image: '🧠',
    tenant: 'zo-system',
    tenantName: 'Zo System',
    preferredStaff: 'Lead Developer',
    nextAvailableSlot: '15:00',
    lastBooked: '2024-01-09'
  },
  {
    id: '5',
    name: 'Code Review',
    price: 200.00,
    duration: 90,
    image: '🔍',
    tenant: 'zo-system',
    tenantName: 'Zo System',
    preferredStaff: 'Senior Architect',
    nextAvailableSlot: '10:30',
    lastBooked: '2024-01-05'
  }
];

export function BookAgain() {
  // TENANT-AWARE: Only show services from current tenant
  const currentTenantSlug = useTenantSlug();
  const tenantFilteredServices = recentBookings.filter(
    service => service.tenant === currentTenantSlug
  );

  // If no services for current tenant, don't render the section
  if (tenantFilteredServices.length === 0) {
    return null;
  }

  const handleBookNow = (service: Service) => {
    // Direct booking with preferred staff and time
    const bookingUrl = `/t/${service.tenant}/booking/${service.id}?staff=${encodeURIComponent(service.preferredStaff)}&time=${service.nextAvailableSlot}`;
    window.location.href = bookingUrl;
  };

  const handleSeeSchedule = (service: Service) => {
    // Show all available times for this service
    const scheduleUrl = `/t/${service.tenant}/services/${service.id}/schedule`;
    window.location.href = scheduleUrl;
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Reservar otra vez</h2>
        <button className="text-red-600 hover:text-red-700 font-medium hover:underline transition-all">
          Ver todas tus reservas →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tenantFilteredServices.map((service) => (
          <div
            key={service.id}
            className="group bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-panel transition-all duration-200 overflow-hidden"
            style={{ borderLeftColor: 'var(--color-brand, #DC2626)', borderLeftWidth: '4px' }}
          >
            {/* Compact Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{service.image}</div>
                  <div>
                    <h3 className="font-semibold text-base text-gray-900">{service.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {/* Duration Chip */}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                        {service.duration} min
                      </span>
                      <span className="text-xs text-gray-500">• {service.preferredStaff}</span>
                    </div>
                  </div>
                </div>
                <span className="text-lg font-bold" style={{ color: 'var(--color-brand, #DC2626)' }}>${service.price}</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Next Slot with Calendar Icon */}
              <div className="flex items-center space-x-3 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Siguiente slot</p>
                  <p className="text-lg font-bold text-green-900">Hoy {service.nextAvailableSlot}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Primary CTA - Reservar hoy con hora específica */}
                <button
                  onClick={() => handleBookNow(service)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:translate-y-[-1px]"
                >
                  Reservar hoy {service.nextAvailableSlot}
                </button>

                {/* Secondary Link - Minimal */}
                <button
                  onClick={() => handleSeeSchedule(service)}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-1"
                >
                  Ver más horarios
                </button>
              </div>

              {/* Last booking info */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Última reserva: {new Date(service.lastBooked).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}