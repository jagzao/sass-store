"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast-provider";
import { useTenantGuard } from "@/lib/auth/hooks/useTenantGuard";

const AVAILABLE_ROLES = [
  {
    id: "Admin",
    name: "Administrador",
    description: "Acceso completo al sistema y gestión de usuarios",
  },
  {
    id: "Gerente",
    name: "Gerente",
    description: "Gestión de operaciones y reportes",
  },
  {
    id: "Personal",
    name: "Personal",
    description: "Acceso limitado a funciones operativas",
  },
  {
    id: "Cliente",
    name: "Cliente",
    description: "Acceso básico para compras y reservas",
  },
];

export default function TenantProfilePage() {
  useTenantGuard(); // Use the new guard hook
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const tenantSlug = params.tenant as string;
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setFormData({
        name: session.user.name || "",
      });
    }
  }, [status, session]);

  useEffect(() => {
    // Load tenant data
    const loadTenantData = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentTenant(data);
        }
      } catch (error) {
        console.error("Error loading tenant:", error);
      }
    };

    loadTenantData();
  }, [tenantSlug]);

  const [currentRole, setCurrentRole] = useState(
    (session?.user as any)?.role || "Cliente",
  );

  const handleRoleChange = (newRole: string) => {
    setPendingRole(newRole);
    setRoleDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRole) return;

    if (!session?.user?.id) {
      showToast("No pudimos identificar al usuario activo", "error");
      return;
    }

    if (!currentTenant?.id) {
      showToast("No pudimos identificar el tenant actual", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: pendingRole,
          tenantId: currentTenant.id,
          userId: session.user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentRole(pendingRole);
        // Actualizar la sesión con el nuevo rol
        await update({
          ...session.user,
          role: pendingRole,
        });

        const roleName = AVAILABLE_ROLES.find(
          (r) => r.id === pendingRole,
        )?.name;
        showToast(
          roleName
            ? `Tu rol ha sido cambiado a ${roleName}`
            : "Tu rol ha sido actualizado",
          "success",
        );
      } else {
        showToast(result.error || "Error al actualizar el rol", "error");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      showToast("Error al actualizar el rol", "error");
    } finally {
      setIsLoading(false);
      setRoleDialogOpen(false);
      setPendingRole(null);
    }
  };

  const handleEdit = () => {
    setFormData({
      name: session?.user?.name || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: formData.name.trim(), tenantSlug }),
      });

      if (response.ok) {
        await update({ name: formData.name.trim() });
        setIsEditing(false);
        showToast("Tu nombre ha sido actualizado correctamente", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Error al actualizar el nombre", "error");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      showToast("Error al actualizar el nombre", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast(
        "La nueva contraseña debe tener al menos 8 caracteres",
        "error",
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          tenantSlug,
        }),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        showToast("Tu contraseña ha sido cambiada correctamente", "success");
      } else {
        const error = await response.json();
        showToast(error.error || "Error al cambiar la contraseña", "error");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showToast("Error al cambiar la contraseña", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a
              href={`/t/${tenantSlug}`}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
            >
              ← Volver a {currentTenant?.name || "Inicio"}
            </a>
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8 relative">
                {isEditing && (
                  <div className="absolute top-8 right-8 flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {session.user.name?.charAt(0)?.toUpperCase() ||
                      session.user.email?.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Hola, {session.user.name?.split(" ")[0] || "Usuario"}
                  </h2>
                  <p className="text-gray-600">{session.user.email}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex justify-between items-center">
                      Información Personal
                      {!isEditing && (
                        <button
                          onClick={handleEdit}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Editar
                        </button>
                      )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tu nombre"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                            {session.user.name || "No especificado"}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                          {session.user.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rol
                        </label>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded capitalize">
                          {AVAILABLE_ROLES.find((r) => r.id === currentRole)
                            ?.name || "Cliente"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Configuración de Cuenta
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          Cambiar Contraseña
                        </div>
                        <div className="text-sm text-gray-600">
                          Actualiza tu contraseña de acceso
                        </div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <div className="font-medium text-gray-900">
                          Preferencias de Notificaciones
                        </div>
                        <div className="text-sm text-gray-600">
                          Configura cómo recibir notificaciones
                        </div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <div className="font-medium text-gray-900">
                          Privacidad
                        </div>
                        <div className="text-sm text-gray-600">
                          Configura tu privacidad y datos
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Admin Links - Only show if tenant has products or services */}
                  {(currentTenant?.products?.length > 0 ||
                    currentTenant?.services?.length > 0) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Administración
                      </h3>
                      <div className="space-y-3">
                        {currentTenant?.products?.length > 0 && (
                          <a
                            href={`/t/${tenantSlug}/admin_products`}
                            className="flex items-center justify-between w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          >
                            <div>
                              <div className="font-medium text-blue-900">
                                Gestionar Productos
                              </div>
                              <div className="text-sm text-blue-700">
                                {currentTenant.products.length} productos
                                registrados
                              </div>
                            </div>
                            <div className="text-blue-600">→</div>
                          </a>
                        )}
                        {currentTenant?.services?.length > 0 && (
                          <a
                            href={`/t/${tenantSlug}/admin_services`}
                            className="flex items-center justify-between w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                          >
                            <div>
                              <div className="font-medium text-green-900">
                                Gestionar Servicios
                              </div>
                              <div className="text-sm text-green-700">
                                {currentTenant.services.length} servicios
                                registrados
                              </div>
                            </div>
                            <div className="text-green-600">→</div>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t">
                    <p className="text-sm text-gray-600 text-center">
                      ID de usuario:{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {session.user.id}
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Management */}
            <div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Gestión de Roles
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona tu rol en el sistema:
                </p>
                <div className="space-y-3">
                  {AVAILABLE_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleChange(role.id)}
                      disabled={isLoading}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                        role.id === currentRole
                          ? "bg-blue-100 border-2 border-blue-500"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {role.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {role.description}
                      </div>
                      {role.id === currentRole && (
                        <div className="text-xs text-blue-600 mt-1">
                          ✓ Rol actual
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas cambiar tu rol a "
              {AVAILABLE_ROLES.find((r) => r.id === pendingRole)?.name}"?
              <br />
              <br />
              Este cambio puede afectar tus permisos en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Cambiar Contraseña
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-600 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Repite la nueva contraseña"
                    minLength={8}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
