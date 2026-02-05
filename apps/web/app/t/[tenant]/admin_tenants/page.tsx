"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import TenantLogoUpload from "@/components/tenant/TenantLogoUpload";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  mode: "booking" | "ecommerce" | "both";
  status: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  currency: string;
  timezone: string;
  language: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TenantsResponse {
  tenants: Tenant[];
  pagination: PaginationData;
}

export default function IntegratedAdminTenantsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;

  // Security check: This page is only for zo-system
  useEffect(() => {
    if (tenantSlug !== "zo-system") {
      router.push(`/t/${tenantSlug}`);
    }
  }, [tenantSlug, router]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Fetch tenants
  const fetchTenants = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12", // Increased limit for grid view
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/tenants?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || "Error al cargar los tenants",
        );
      }

      const data: TenantsResponse = await response.json();
      setTenants(data.tenants);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug === "zo-system") {
      fetchTenants();
    }
  }, [tenantSlug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTenants(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchTenants(page, searchTerm);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowEditModal(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDeleteModal(true);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleTenantCreated = () => {
    setShowCreateModal(false);
    fetchTenants(pagination.page, searchTerm);
  };

  const handleTenantUpdated = () => {
    setShowEditModal(false);
    setSelectedTenant(null);
    fetchTenants(pagination.page, searchTerm);
  };

  const handleTenantDeleted = () => {
    setShowDeleteModal(false);
    setSelectedTenant(null);
    fetchTenants(pagination.page, searchTerm);
  };

  if (tenantSlug !== "zo-system") {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen text-white p-8 font-[family-name:var(--font-montserrat)] relative overflow-hidden">
      {/* Background Elements */}
      {/* Note: Use fixed positioning relative to container or rely on global layout background */}

      <div className="max-w-7xl mx-auto mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
              Gestión de <span className="text-[#FF8000]">Tenants</span>
            </h1>
            <p className="text-gray-400">
              Administra el ecosistema de aplicaciones desde un solo lugar
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="group relative px-6 py-3 bg-[#FF8000] text-black font-bold uppercase tracking-wider rounded-sm hover:bg-[#ff9933] transition-all clip-path-polygon"
            style={{
              clipPath:
                "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
            }}
          >
            <div className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              <span>Nuevo Tenant</span>
            </div>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[#121212]/50 p-4 border border-white/5 rounded-lg backdrop-blur-sm">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar tenant por nombre, slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0D0D0D] border border-white/10 rounded focus:border-[#FF8000] focus:ring-1 focus:ring-[#FF8000] text-white outline-none placeholder-gray-600"
            />
          </form>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded border transition-colors ${viewMode === "grid" ? "bg-[#FF8000]/10 border-[#FF8000] text-[#FF8000]" : "bg-[#0D0D0D] border-white/10 text-gray-400 hover:text-white"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded border transition-colors ${viewMode === "list" ? "bg-[#FF8000]/10 border-[#FF8000] text-[#FF8000]" : "bg-[#0D0D0D] border-white/10 text-gray-400 hover:text-white"}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF8000]"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-900/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="group relative bg-[#121212] border border-white/5 hover:border-[#FF8000]/50 transition-all duration-300 rounded-lg overflow-hidden flex flex-col h-full"
                  >
                    {/* Status Indicator: Green (Active) / Red (Inactive) */}
                    <div
                      className={`absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-transparent ${tenant.status === "active" ? "border-r-[#EAFF00]" : "border-r-red-500"}`}
                    />

                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded bg-[#1a1a1a] flex items-center justify-center text-xl font-bold text-[#FF8000] border border-white/10 group-hover:border-[#FF8000]/30 transition-colors uppercase">
                          {tenant.slug.substring(0, 2)}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#FF8000] transition-colors">
                        {tenant.name}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono mb-4 text-ellipsis overflow-hidden">
                        /t/{tenant.slug}
                      </p>

                      {tenant.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {tenant.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded border ${
                            tenant.mode === "booking"
                              ? "bg-blue-900/20 border-blue-800 text-blue-400"
                              : tenant.mode === "ecommerce"
                                ? "bg-green-900/20 border-green-800 text-green-400"
                                : "bg-purple-900/20 border-purple-800 text-purple-400"
                          }`}
                        >
                          {tenant.mode.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded border border-white/10 bg-white/5 text-gray-400">
                          {tenant.currency}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center group-hover:bg-[#151515] transition-colors">
                      <Link
                        href={`/t/${tenant.slug}`}
                        target="_blank"
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" /> Ver
                      </Link>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(tenant)}
                          disabled={tenant.slug === "zo-system"}
                          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${tenant.slug === "zo-system" ? "opacity-30 cursor-not-allowed" : "text-blue-400"}`}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant)}
                          disabled={tenant.slug === "zo-system"}
                          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${tenant.slug === "zo-system" ? "opacity-30 cursor-not-allowed" : "text-red-400"}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#121212] border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Modo
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded bg-[#1a1a1a] flex items-center justify-center text-[#FF8000] font-bold border border-white/10 mr-4">
                              {tenant.slug.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {tenant.name}
                              </div>
                              <div className="text-sm text-gray-500 font-mono">
                                /t/{tenant.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded border ${
                              tenant.mode === "booking"
                                ? "bg-blue-900/20 border-blue-800 text-blue-400"
                                : tenant.mode === "ecommerce"
                                  ? "bg-green-900/20 border-green-800 text-green-400"
                                  : "bg-purple-900/20 border-purple-800 text-purple-400"
                            }`}
                          >
                            {tenant.mode.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div>{tenant.contactEmail}</div>
                          {tenant.contactPhone && (
                            <div className="text-xs text-gray-600">
                              {tenant.contactPhone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${tenant.status === "active" ? "bg-[#EAFF00] shadow-[0_0_8px_#EAFF00]" : "bg-red-500"}`}
                            />
                            <span
                              className={`text-sm ${tenant.status === "active" ? "text-white" : "text-gray-500"}`}
                            >
                              {tenant.status === "active"
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/t/${tenant.slug}`}
                              target="_blank"
                              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                              title="Ver"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleEdit(tenant)}
                              disabled={tenant.slug === "zo-system"}
                              className={`p-1.5 rounded hover:bg-white/10 transition-colors ${tenant.slug === "zo-system" ? "cursor-not-allowed opacity-50" : "text-blue-400"}`}
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tenant)}
                              disabled={tenant.slug === "zo-system"}
                              className={`p-1.5 rounded hover:bg-white/10 transition-colors ${tenant.slug === "zo-system" ? "cursor-not-allowed opacity-50" : "text-red-400"}`}
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-[#121212] border border-white/10 rounded text-gray-400 hover:text-white hover:border-[#FF8000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-500">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-[#121212] border border-white/10 rounded text-gray-400 hover:text-white hover:border-[#FF8000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTenantCreated}
        />
      )}

      {showEditModal && selectedTenant && (
        <EditTenantModal
          tenant={selectedTenant}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTenant(null);
          }}
          onSuccess={handleTenantUpdated}
        />
      )}

      {showDeleteModal && selectedTenant && (
        <DeleteTenantModal
          tenant={selectedTenant}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTenant(null);
          }}
          onSuccess={handleTenantDeleted}
        />
      )}
    </div>
  );
}

// Reusable Modal Styles
// Reusable Modal Styles
const modalOverlayClass =
  "fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200";
const modalContentClass =
  "bg-[#0A0A0A] border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.7)] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200";
const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
const inputClass =
  "w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#FF8000] focus:ring-1 focus:ring-[#FF8000] transition-all placeholder-gray-700 hover:border-white/10";
const buttonPrimaryClass =
  "px-6 py-2.5 bg-[#FF8000] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-[#ff9933] hover:shadow-[0_0_20px_rgba(255,128,0,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0";
const buttonSecondaryClass =
  "px-6 py-2.5 bg-transparent border border-white/10 text-gray-300 font-bold uppercase tracking-wider rounded-lg hover:bg-white/5 hover:text-white transition-colors";

function CreateTenantModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    mode: "booking" as "booking" | "ecommerce" | "both",
    currency: "MXN",
    timezone: "America/Mexico_City",
    isActive: true,
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    country: "",
    // Branding
    theme: {
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      logoUrl: "",
    },
    // Admin User
    adminUser: {
      email: "",
      name: "",
      password: "",
    },
    // Seed Data
    seedData: {
      products: true,
      services: true,
      customers: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el tenant");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNestedChange = (
    parent: "adminUser" | "theme" | "seedData",
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  return (
    <div className={modalOverlayClass}>
      <div className={modalContentClass}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
            Nuevo Tenant <span className="text-[#FF8000]">- Paso {step}/4</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[#FF8000]" : "bg-white/10"}`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paso 1: Información Básica */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-white font-bold mb-4">
                  Información General
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Slug *</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                      pattern="^[a-z0-9-]+$"
                      title="Solo letras minúsculas, números y guiones"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Modo</label>
                    <select
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option
                        value="booking"
                        className="bg-[#1A1A1A] text-white"
                      >
                        Reservas
                      </option>
                      <option
                        value="ecommerce"
                        className="bg-[#1A1A1A] text-white"
                      >
                        E-commerce
                      </option>
                      <option value="both" className="bg-[#1A1A1A] text-white">
                        Ambos
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Moneda</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="MXN" className="bg-[#1A1A1A] text-white">
                        MXN - Peso Mexicano
                      </option>
                      <option value="USD" className="bg-[#1A1A1A] text-white">
                        USD - Dólar Americano
                      </option>
                      <option value="EUR" className="bg-[#1A1A1A] text-white">
                        EUR - Euro
                      </option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Descripción</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Usuario Admin */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-white font-bold mb-4">
                  Usuario Administrador
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Este usuario tendrá acceso total al nuevo tenant.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>Nombre Admin</label>
                    <input
                      type="text"
                      value={formData.adminUser.name}
                      onChange={(e) =>
                        handleNestedChange("adminUser", "name", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Admin *</label>
                    <input
                      type="email"
                      value={formData.adminUser.email}
                      onChange={(e) =>
                        handleNestedChange("adminUser", "email", e.target.value)
                      }
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contraseña *</label>
                    <input
                      type="password"
                      value={formData.adminUser.password}
                      onChange={(e) =>
                        handleNestedChange(
                          "adminUser",
                          "password",
                          e.target.value,
                        )
                      }
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Branding */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-white font-bold mb-4">
                  Personalización (Branding)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Color Primario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.theme.primaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "theme",
                            "primaryColor",
                            e.target.value,
                          )
                        }
                        className="h-10 w-10 bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.theme.primaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "theme",
                            "primaryColor",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Color Secundario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.theme.secondaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "theme",
                            "secondaryColor",
                            e.target.value,
                          )
                        }
                        className="h-10 w-10 bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.theme.secondaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "theme",
                            "secondaryColor",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-[#252525] p-3 rounded-lg border border-white/10">
                    <label className={labelClass + " mb-2 block"}>
                      Logo del Tenant
                    </label>
                    <div className="bg-white rounded-lg p-2 max-w-sm mx-auto">
                      <TenantLogoUpload
                        currentLogo={formData.theme.logoUrl}
                        onLogoChange={(url) =>
                          handleNestedChange("theme", "logoUrl", url || "")
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Formato recomendado: PNG transparente o SVG
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4: Datos de Prueba y Confirmación */}
            {step === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-white font-bold mb-4">
                  Configuración Inicial
                </h4>

                <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
                  <h5 className="font-bold text-[#FF8000] mb-2 uppercase text-sm">
                    Resumen
                  </h5>
                  <p className="text-gray-300 text-sm">
                    Tenant:{" "}
                    <strong className="text-white">{formData.name}</strong> (
                    {formData.slug})
                  </p>
                  <p className="text-gray-300 text-sm">
                    Admin:{" "}
                    <strong className="text-white">
                      {formData.adminUser.email}
                    </strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Datos de Ejemplo (Seed Data)
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer bg-[#0D0D0D] p-3 rounded border border-white/10 hover:border-[#FF8000]/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.seedData.products}
                      onChange={(e) =>
                        handleNestedChange(
                          "seedData",
                          "products",
                          e.target.checked,
                        )
                      }
                      className="accent-[#FF8000] w-4 h-4"
                    />
                    <span className="text-gray-300">
                      Incluir Productos de ejemplo
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-[#0D0D0D] p-3 rounded border border-white/10 hover:border-[#FF8000]/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.seedData.services}
                      onChange={(e) =>
                        handleNestedChange(
                          "seedData",
                          "services",
                          e.target.checked,
                        )
                      }
                      className="accent-[#FF8000] w-4 h-4"
                    />
                    <span className="text-gray-300">
                      Incluir Servicios de ejemplo
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-white/10 mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 bg-[#121212] border border-white/20 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-white/5 transition-colors"
                >
                  Anterior
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className={buttonSecondaryClass}
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={buttonPrimaryClass}
              >
                {loading
                  ? "Procesando..."
                  : step === 4
                    ? "Crear Tenant"
                    : "Siguiente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditTenantModal({
  tenant,
  onClose,
  onSuccess,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSuccess: () => void;
}) {
  console.log("EditTenantModal tenant data:", tenant);
  const [activeTab, setActiveTab] = useState<"general" | "branding" | "admin">(
    "general",
  );
  const [formData, setFormData] = useState({
    name: tenant.name,
    slug: tenant.slug,
    description: tenant.description || "",
    mode: tenant.mode as "booking" | "ecommerce" | "both",
    isActive: tenant.status === "active",
    contactEmail: tenant.contactEmail || tenant.contact?.email || "",
    contactPhone: tenant.contactPhone || tenant.contact?.phone || "",
    address: tenant.address || "",
    city: tenant.city || "",
    country: tenant.country || "",
    currency: tenant.currency || "MXN",
    timezone: tenant.timezone || "America/Mexico_City",
    language: tenant.language || "es",
    // Branding
    branding: {
      primaryColor: tenant.branding?.primaryColor || "#000000",
      secondaryColor: tenant.branding?.secondaryColor || "#ffffff",
      accentColor: tenant.branding?.accentColor || "#F59E0B",
      logoUrl: tenant.branding?.logoUrl || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/manage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: tenant.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el tenant");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNestedChange = (
    parent: "branding",
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  return (
    <div className={modalOverlayClass}>
      <div className={modalContentClass}>
        {/* ... Header and Error ... */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
            Editar Tenant{" "}
            <span className="text-[#FF8000]">- {tenant.name}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex border-b border-white/10 mb-6">
            <button
              className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === "general" ? "text-[#FF8000]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("general")}
            >
              General
              {activeTab === "general" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF8000]" />
              )}
            </button>
            <button
              className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === "branding" ? "text-[#FF8000]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("branding")}
            >
              Branding
              {activeTab === "branding" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF8000]" />
              )}
            </button>
            <button
              className={`pb-2 px-4 font-medium text-sm transition-colors relative ${activeTab === "admin" ? "text-[#FF8000]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("admin")}
            >
              Admin & Contacto
              {activeTab === "admin" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF8000]" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Slug</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      disabled
                      className={`${inputClass} opacity-50 cursor-not-allowed`}
                      title="El slug no se puede cambiar"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Modo</label>
                    <select
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option
                        value="booking"
                        className="bg-[#1A1A1A] text-white"
                      >
                        Reservas
                      </option>
                      <option
                        value="ecommerce"
                        className="bg-[#1A1A1A] text-white"
                      >
                        E-commerce
                      </option>
                      <option value="both" className="bg-[#1A1A1A] text-white">
                        Ambos
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Estado</label>
                    <label className="flex items-center gap-3 p-2.5 border border-white/5 rounded-lg bg-[#1A1A1A] cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="accent-[#FF8000] w-5 h-5"
                      />
                      <span
                        className={
                          formData.isActive ? "text-white" : "text-gray-500"
                        }
                      >
                        {formData.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Descripción</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === "branding" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Theme Selector */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Tema (Modo)</label>
                    <select
                      value={(formData.branding as any).theme || "light"}
                      onChange={(e) =>
                        handleNestedChange("branding", "theme", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="light" className="bg-[#1A1A1A] text-white">
                        Claro (Light)
                      </option>
                      <option value="dark" className="bg-[#1A1A1A] text-white">
                        Oscuro (Dark)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Color Primario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.branding.primaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "branding",
                            "primaryColor",
                            e.target.value,
                          )
                        }
                        className="h-10 w-10 bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.branding.primaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "branding",
                            "primaryColor",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Color Secundario</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.branding.secondaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "branding",
                            "secondaryColor",
                            e.target.value,
                          )
                        }
                        className="h-10 w-10 bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.branding.secondaryColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "branding",
                            "secondaryColor",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Color de Acento</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.branding.accentColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "branding",
                            "accentColor",
                            e.target.value,
                          )
                        }
                        className="h-10 w-10 bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.branding.accentColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "branding",
                            "accentColor",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 bg-[#252525] p-3 rounded-lg border border-white/10">
                    <label className={labelClass + " mb-2 block"}>
                      Logo del Tenant
                    </label>
                    <div className="bg-white rounded-lg p-2 max-w-sm mx-auto">
                      <TenantLogoUpload
                        currentLogo={formData.branding.logoUrl}
                        onLogoChange={(url) =>
                          handleNestedChange("branding", "logoUrl", url || "")
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Formato recomendado: PNG transparente o SVG
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ... Admin Tab ... */}

            {/* ... Buttons ... */}

            {/* Admin Tab */}
            {activeTab === "admin" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>
                      Email de Contacto / Admin
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="admin@tenant.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Teléfono de Contacto</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="+52..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                className={buttonSecondaryClass}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={buttonPrimaryClass}
              >
                {loading ? "Guardar" : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteTenantModal({
  tenant,
  onClose,
  onSuccess,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName !== tenant.name) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenants/manage`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: tenant.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al eliminar el tenant");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={modalOverlayClass}>
      <div className="bg-[#121212] border border-red-500/30 rounded-lg shadow-[0_0_50px_rgba(200,0,0,0.2)] w-full max-w-md">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
            <TrashIcon className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2 font-[family-name:var(--font-rajdhani)]">
            ¿Eliminar Tenant?
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Esta acción es irreversible. Se eliminarán todos los datos asociados
            a <span className="text-white font-bold">{tenant.name}</span>.
          </p>

          <form onSubmit={handleSubmit} className="text-left">
            <label className={labelClass}>
              Escribe "
              <span className="text-white select-none">{tenant.name}</span>"
              para confirmar
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className={`${inputClass} border-red-900/50 focus:border-red-500 focus:ring-red-500`}
              placeholder={tenant.name}
            />

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-transparent border border-white/20 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={confirmName !== tenant.name || loading}
                className="flex-1 py-2 bg-red-600 text-white font-bold uppercase tracking-wider rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
