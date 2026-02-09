"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  const searchParamsHook = useSearchParams();

  // Add debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
       const newParams = new URLSearchParams();
       
       if (search) newParams.set("search", search);
       if (status && status !== "all") newParams.set("status", status);
       
       // Preserve sort/order from props (OR rely on hook if props are unstable, but props are passed from server which is fine if we check equality)
       // Actually, let's use the hook for the current state of sort/order to be safer against prop reference changes
       // restarting the effect.
       
       const currentSort = searchParamsHook.get("sort");
       const currentOrder = searchParamsHook.get("order");

       if (currentSort) {
         newParams.set("sort", currentSort);
       }
       if (currentOrder) {
         newParams.set("order", currentOrder);
       }

       const queryString = newParams.toString();
       const currentQueryString = searchParamsHook.toString();

       // Only push if the query string has effectively changed
       // We need to be careful about parameter order, but URLSearchParams usually sorts or we can just compare values?
       // Simplest is to check if newParams is different from current.
       
       if (queryString !== currentQueryString) {
          router.push(`${pathname}?${queryString}`);
       }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search, status, pathname, router, searchParamsHook]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (option: SelectOption | string | null) => {
    // We expect SelectOption for single select, but the type allows string
    if (typeof option === 'string') return; 
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
