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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        <span className="sr-only">Eliminar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
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
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
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
                    {services.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No hay servicios registrados aún. Crea tu primer
                          servicio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
