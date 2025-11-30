"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

interface CustomersFiltersProps {
  tenantSlug: string;
  searchParams: {
    search?: string;
    status?: string;
  };
}

export default function CustomersFilters({ tenantSlug, searchParams }: CustomersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.search || "");
  const [status, setStatus] = useState(searchParams.status || "all");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    // Update URL with debounce
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    if (status && status !== "all") params.set("status", status);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatus(value);

    // Update URL
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value && value !== "all") params.set("status", value);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, teléfono o email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={status}
            onChange={handleStatusChange}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="blocked">Bloqueadas</option>
          </select>
        </div>
      </div>
    </div>
  );
}
