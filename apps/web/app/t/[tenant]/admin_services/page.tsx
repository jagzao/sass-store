"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import { Trash2, Pencil } from "lucide-react";
import SingleImageUpload from "@/components/ui/single-image-upload";
import { useFormPersist } from "@/hooks/useFormPersist";
import MenuDesignerModal from "@/components/admin/menu-designer/MenuDesignerModal";
import AdminRouteGuard from "@/components/auth/AdminRouteGuard";
import { useTenantTheme } from "@/lib/hooks/useTenantTheme";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl?: string;
  videoUrl?: string;
  duration: number;
  featured: boolean;
  active: boolean;
  metadata?: any;
  createdAt: string;
}

export default function AdminServicesPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { isDark, getFormStyles } = useTenantTheme(tenantSlug);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMenuDesigner, setShowMenuDesigner] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Search, Sort, Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Service;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Derived filtered & sorted services
  const filteredServices = services
    .filter((service) => {
      if (searchTerm.length < 3) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return (
        service.name.toLowerCase().includes(lowerSearch) ||
        service.description.toLowerCase().includes(lowerSearch)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) return 0;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSort = (key: keyof Service) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Form persistence with localStorage
  const {
    values: formData,
    setValues: setFormData,
    setFieldValue,
    clearPersistedData,
    hasDraft,
    isRestored,
  } = useFormPersist({
    key: `service-form-${tenantSlug}`,
    initialValues: {
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      videoUrl: "",
      duration: "",
      featured: false,
      active: true,
    },
    excludeFields: [], // No sensitive data in this form
  });

  /*
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
    }
  }, [status, router, tenantSlug]);
  */

  useEffect(() => {
    loadTenantData();
    loadServices();
  }, [tenantSlug]);

  const loadTenantData = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantSlug}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentTenant(data);
      }
    } catch (error) {
      console.error("Error loading tenant data:", error);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/public/services?tenant=${tenantSlug}`,
      );
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      imageUrl: service.imageUrl || "",
      videoUrl: service.videoUrl || "",
      duration: service.duration.toString(),
      featured: service.featured,
      active: service.active,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/services/${serviceId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        alert("Servicio eliminado exitosamente");
        loadServices();
      } else {
        alert("Error al eliminar el servicio");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Error al eliminar el servicio");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `/api/tenants/${tenantSlug}/services/${editingService.id}`
        : `/api/tenants/${tenantSlug}/services`;

      const method = editingService ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration: parseFloat(formData.duration),
        }),
      });

      if (response.ok) {
        alert(
          editingService
            ? "Servicio actualizado exitosamente"
            : "Servicio creado exitosamente",
        );
        closeModal();
        loadServices();
      } else {
        alert("Error al guardar el servicio");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio");
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      videoUrl: "",
      duration: "",
      featured: false,
      active: true,
    });
    clearPersistedData(); // Clear persisted draft
  };

  /*
  if (!session?.user) {
    return null;
  }
  */

  return (
    <AdminRouteGuard tenantSlug={tenantSlug}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}

        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Servicios</h2>
              <p className="text-gray-600">
                Gestiona el catálogo de servicios de tu negocio
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMenuDesigner(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
              >
                <span>📜</span> Menú
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Nuevo Servicio
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Cargando servicios...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        <span className="sr-only">Editar</span>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          Nombre
                          {sortConfig.key === "name" && (
                            <span>
                              {sortConfig.direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("duration")}
                      >
                        <div className="flex items-center gap-1">
                          Duración
                          {sortConfig.key === "duration" && (
                            <span>
                              {sortConfig.direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center gap-1">
                          Precio
                          {sortConfig.key === "price" && (
                            <span>
                              {sortConfig.direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("active")}
                      >
                        <div className="flex items-center gap-1">
                          Estado
                          {sortConfig.key === "active" && (
                            <span>
                              {sortConfig.direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        <span className="sr-only">Eliminar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {service.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {service.description || "Sin descripción"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {service.duration} h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${service.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              service.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {service.active ? "Activo" : "Inactivo"}
                          </span>
                          {service.featured && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-stone-100 text-stone-800">
                              Destacado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginatedServices.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          {searchTerm.length >= 3
                            ? "No se encontraron servicios que coincidan con tu búsqueda."
                            : "No hay servicios registrados aún."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    a{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredServices.length,
                      )}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium">{filteredServices.length}</span>{" "}
                    resultados
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingService
                        ? "Editar Servicio"
                        : "Crear Nuevo Servicio"}
                    </h2>
                    {hasDraft && !editingService && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Borrador guardado
                        </span>
                        <button
                          type="button"
                          onClick={clearPersistedData}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-600 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Servicio *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFieldValue("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Manicure Premium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFieldValue("description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción detallada del servicio"
                    />
                  </div>

                  <div>
                    <SingleImageUpload
                      value={formData.imageUrl}
                      onChange={(url) => setFieldValue("imageUrl", url)}
                      label="Imagen del Servicio (Opcional)"
                    />
                  </div>

                  <div>
                    <SingleImageUpload
                      value={formData.videoUrl}
                      onChange={(url) => setFieldValue("videoUrl", url)}
                      label="Video del Servicio (Opcional - MP4, WebM)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFieldValue("price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración (Horas) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={formData.duration}
                        onChange={(e) =>
                          setFieldValue("duration", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) =>
                          setFieldValue("featured", e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Servicio destacado
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) =>
                          setFieldValue("active", e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Servicio activo
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingService
                        ? "Actualizar Servicio"
                        : "Crear Servicio"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Menu Designer Modal */}
        {showMenuDesigner && (
          <MenuDesignerModal
            isOpen={showMenuDesigner}
            onClose={() => setShowMenuDesigner(false)}
            tenantSlug={tenantSlug}
          />
        )}
      </div>
    </AdminRouteGuard>
  );
}
