"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calendar, TrendingUp, Clock } from "lucide-react";

interface CustomerSummary {
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  nextAppointment?: string;
}

interface CustomerFileSummaryProps {
  tenantSlug: string;
  customerId: string;
}

export default function CustomerFileSummary({ tenantSlug, customerId }: CustomerFileSummaryProps) {
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await fetch(
          `/api/tenants/${tenantSlug}/customers/${customerId}/summary`
        );
        if (!response.ok) throw new Error("Failed to fetch summary");
        const data = await response.json();
        setSummary(data.summary);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [tenantSlug, customerId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      name: "Total Gastado",
      value: `$${summary?.totalSpent.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Número de Visitas",
      value: summary?.visitCount || 0,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Última Visita",
      value: summary?.lastVisit
        ? new Date(summary.lastVisit).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Sin visitas",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Próxima Cita",
      value: summary?.nextAppointment
        ? new Date(summary.nextAppointment).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Sin cita",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const isLuxury = tenantSlug === 'wondernails';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className={`${isLuxury ? 'bg-[#1a1a1a]/60 border border-[#D4AF37]/20 backdrop-blur-md' : 'bg-white shadow'} rounded-lg p-6`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${isLuxury ? 'bg-[#D4AF37]/10' : stat.bgColor} rounded-md p-3`}>
                <Icon className={`h-6 w-6 ${isLuxury ? 'text-[#D4AF37]' : stat.color}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-500'}`}>{stat.name}</p>
                <p className={`text-2xl font-semibold ${isLuxury ? 'text-white font-serif' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
