"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SearchableSelectSingle } from "@/components/ui/forms/SearchableSelectSingle";
import { SelectOption } from "@/components/ui/forms/SearchableSelect";

interface CustomersFiltersProps {
  tenantSlug: string;
  searchParams: {
    search?: string;
    status?: string;
  };
}

export default function CustomersFilters({
  tenantSlug,
  searchParams,
}: CustomersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.search || "");
  const [status, setStatus] = useState(searchParams.status || "all");

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Todos los estados" },
      { value: "active", label: "Activas" },
      { value: "inactive", label: "Inactivas" },
      { value: "blocked", label: "Bloqueadas" },
    ],
    [],
  );

  // Add debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);

      router.push(`${pathname}?${params.toString()}`);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search, status, pathname, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (option: SelectOption | null) => {
    setStatus(option?.value || "all");
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
          <SearchableSelectSingle
            options={statusOptions}
            value={status}
            onChange={handleStatusChange}
            placeholder="Seleccionar estado"
            isSearchable={false}
          />
        </div>
      </div>
    </div>
  );
}
