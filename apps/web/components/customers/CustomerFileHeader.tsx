"use client";

import {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { getClientTerms } from "@/lib/tenant/client-terminology";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  MapPin,
  Trash2,
  Plus,
  Calendar,
  Activity,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HistorialMedico, {
  type HistorialMedicoData,
  type HistorialMedicoHandle,
} from "./HistorialMedico";

export interface CustomerFileHeaderHandle {
  saveHistorial: () => Promise<void>;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  generalNotes?: string;
  birthday?: string;
  tags: string[];
  status: "active" | "inactive" | "blocked";
}

interface CustomerFileHeaderProps {
  tenantSlug: string;
  customerId: string;
}

const CustomerFileHeader = forwardRef<
  CustomerFileHeaderHandle,
  CustomerFileHeaderProps
>(({ tenantSlug, customerId }, ref) => {
  const t = getClientTerms(tenantSlug);
  const historialRef = useRef<HistorialMedicoHandle>(null);

  useImperativeHandle(ref, () => ({
    saveHistorial: async () => {
      await historialRef.current?.save();
    },
  }));

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [editedBirthday, setEditedBirthday] = useState("");
  const [editedStatus, setEditedStatus] = useState<
    "active" | "inactive" | "blocked"
  >("active");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{
    visits: number;
    bookings: number;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchCustomer() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/tenants/${tenantSlug}/customers/${customerId}`,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (!data.customer) {
          throw new Error(`No se encontraron datos del ${t.singularLower}`);
        }

        setCustomer(data.customer);
        if (data.stats) {
          setStats(data.stats);
        }
        setEditedNotes(data.customer.generalNotes || "");
        setEditedName(data.customer.name || "");
        setEditedPhone(data.customer.phone || "");
        setEditedEmail(data.customer.email || "");
        setEditedAddress(data.customer.address || "");
        setEditedBirthday(
          data.customer.birthday
            ? new Date(data.customer.birthday).toISOString().split("T")[0]
            : "",
        );
        setEditedStatus(data.customer.status || "active");
        setEditedTags(data.customer.tags || []);
        setSaveError(null);
        setValidationError(null);
      } catch (error) {
        console.error("Error fetching customer:", error);
        setError(
          error instanceof Error
            ? error.message
            : `Error al cargar la información del ${t.singularLower}`,
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [tenantSlug, customerId]);

  const handleSave = async () => {
    if (!customer) return;

    // Validation
    if (!editedName.trim()) {
      setValidationError("El nombre es obligatorio.");
      return;
    }
    if (!editedPhone.trim()) {
      setValidationError("El teléfono es obligatorio.");
      return;
    }
    if (
      editedEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedEmail.trim())
    ) {
      setValidationError("El correo electrónico no es válido.");
      return;
    }
    setValidationError(null);
    setSaveError(null);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editedName.trim(),
            phone: editedPhone.trim(),
            email: editedEmail.trim() || null,
            address: editedAddress.trim() || null,
            birthday: editedBirthday || null,
            status: editedStatus,
            generalNotes: editedNotes.trim() || null,
            tags: editedTags,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update customer");
      }

      const updatedData = await response.json();

      setCustomer(updatedData.customer);
      setEditing(false);
      setSaveError(null);
    } catch (error) {
      console.error("Error updating customer:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Error al guardar los cambios. Intente nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!customer) return;
    setEditedName(customer.name || "");
    setEditedPhone(customer.phone || "");
    setEditedEmail(customer.email || "");
    setEditedAddress(customer.address || "");
    setEditedBirthday(
      customer.birthday
        ? new Date(customer.birthday).toISOString().split("T")[0]
        : "",
    );
    setEditedStatus(customer.status || "active");
    setEditedNotes(customer.generalNotes || "");
    setEditedTags(customer.tags || []);
    setValidationError(null);
    setSaveError(null);
    setEditing(false);
  };

  const addTag = () => {
    if (newTag && !editedTags.includes(newTag)) {
      setEditedTags([...editedTags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/tenants/${tenantSlug}/customers/${customerId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete customer");

      // Use Next.js router for navigation after successful deletion
      router.push(`/t/${tenantSlug}/clientes`);
      router.refresh(); // Force a refresh to update the customer list
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(`Error al eliminar el ${t.singularLower}`);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error al cargar la información
            </h3>
            <p className="text-red-700 mb-4">
              {error ||
                `No se pudo cargar la información del ${t.singularLower}. Por favor, intente nuevamente.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-colors"
              >
                Recargar página
              </button>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  // Reintentar cargar los datos
                  fetch(`/api/tenants/${tenantSlug}/customers/${customerId}`)
                    .then((response) => {
                      if (!response.ok)
                        throw new Error("Failed to fetch customer");
                      return response.json();
                    })
                    .then((data) => {
                      setCustomer(data.customer);
                      setEditedNotes(data.customer.generalNotes || "");
                      setError(null);
                    })
                    .catch((err) => {
                      console.error("Error retrying fetch:", err);
                      setError(
                        err instanceof Error
                          ? err.message
                          : `Error al cargar la información del ${t.singularLower}`,
                      );
                    })
                    .finally(() => setLoading(false));
                }}
                className="px-3 py-1 bg-white text-red-800 border border-red-300 rounded-md text-sm hover:bg-red-50 transition-colors"
              >
                Reintentar
              </button>
              <a
                href={`/t/${tenantSlug}/clientes`}
                className="px-3 py-1 bg-white text-red-800 border border-red-300 rounded-md text-sm hover:bg-red-50 transition-colors"
              >
                Volver a {t.pluralLower}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLuxury = tenantSlug === "wondernails";

  return (
    <div
      className={`${isLuxury ? "bg-white/80 border border-[#D4AF37]/20 backdrop-blur-md shadow-sm" : "bg-white shadow"} rounded-lg p-6 mb-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className={`w-16 h-16 rounded-full ${isLuxury ? "bg-gradient-to-br from-[#D4AF37] to-[#b3932d]" : "bg-gradient-to-br from-blue-400 to-blue-600"} flex items-center justify-center`}
            >
              <User
                className={`h-8 w-8 ${isLuxury ? "text-white" : "text-white"}`}
              />
            </div>
          </div>

          {/* Info */}
          <div>
            {editing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={`text-2xl font-bold h-auto py-1 px-2 mb-2 ${
                  isLuxury
                    ? "text-[#1a1a1a] font-serif border-[#D4AF37]/50 focus-visible:ring-[#D4AF37]"
                    : "text-gray-900"
                }`}
                data-testid="input-name"
              />
            ) : (
              <h1
                className={`text-2xl font-bold ${isLuxury ? "text-[#1a1a1a] font-serif" : "text-gray-900"}`}
              >
                {customer.name}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2">
              {editing ? (
                <div className="flex flex-col gap-2 w-full max-w-md">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <Input
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Teléfono"
                      className="h-8"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      className="h-8"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={editedBirthday}
                      onChange={(e) => setEditedBirthday(e.target.value)}
                      className="h-8"
                      data-testid="input-birthday"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <Input
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      placeholder="Dirección completa"
                      className="h-8"
                      data-testid="input-address"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <select
                      value={editedStatus}
                      onChange={(e) =>
                        setEditedStatus(
                          e.target.value as "active" | "inactive" | "blocked",
                        )
                      }
                      className="h-8 text-sm border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="select-status"
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                      <option value="blocked">Bloqueada</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`flex items-center text-sm ${isLuxury ? "text-gray-600" : "text-gray-600"}`}
                  >
                    <Phone
                      className={`h-4 w-4 mr-1 ${isLuxury ? "text-[#D4AF37]" : ""}`}
                    />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div
                      className={`flex items-center text-sm ${isLuxury ? "text-gray-600" : "text-gray-600"}`}
                    >
                      <Mail
                        className={`h-4 w-4 mr-1 ${isLuxury ? "text-[#D4AF37]" : ""}`}
                      />
                      {customer.email}
                    </div>
                  )}
                  {customer.birthday && (
                    <div
                      className={`flex items-center text-sm ${isLuxury ? "text-gray-600" : "text-gray-600"}`}
                    >
                      <Calendar
                        className={`h-4 w-4 mr-1 ${isLuxury ? "text-[#D4AF37]" : ""}`}
                      />
                      {new Date(customer.birthday).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                  {customer.address && (
                    <div
                      className={`flex items-center text-sm ${isLuxury ? "text-gray-600" : "text-gray-600"}`}
                    >
                      <MapPin
                        className={`h-4 w-4 mr-1 ${isLuxury ? "text-[#D4AF37]" : ""}`}
                      />
                      {customer.address}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge + Edit + Delete */}
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isLuxury
                  ? "bg-[#D4AF37]/10 text-[#b3932d] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20"
                  : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
              }`}
              title={`Editar ${t.singularLower}`}
              data-testid="btn-edit-customer"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          )}

          <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              isLuxury
                ? customer.status === "active"
                  ? "bg-[#D4AF37]/10 text-[#b3932d] border border-[#D4AF37]/20"
                  : customer.status === "inactive"
                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                    : "bg-red-50 text-red-600 border border-red-100"
                : customer.status === "active"
                  ? "bg-green-100 text-green-800"
                  : customer.status === "inactive"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
            }`}
          >
            {customer.status === "active"
              ? "Activa"
              : customer.status === "inactive"
                ? "Inactiva"
                : "Bloqueada"}
          </span>

          {/* Delete Button */}
          <ConfirmDialog
            trigger={
              <button
                className="ml-2 p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title={`Eliminar ${t.singularLower}`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            }
            title={`¿Eliminar este ${t.singularLower}?`}
            description={`Esta acción no se puede deshacer. Se eliminará permanentemente el ${t.singularLower}`}
            subjectName={customer.name}
            impactItems={
              stats
                ? [
                    { count: stats.visits, label: "Visitas completadas" },
                    {
                      count: stats.bookings,
                      label: "Reservas (pendientes o pasadas)",
                    },
                  ]
                : undefined
            }
            confirmLabel="Eliminar permanentemente"
            loadingLabel="Eliminando…"
            onConfirm={handleDelete}
            loading={isDeleting}
          />
        </div>
      </div>

      {/* Tags */}
      {(customer.tags?.length > 0 || editing) && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            {(editing ? editedTags : customer.tags).map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isLuxury
                    ? "bg-[#f9f9f9] text-gray-600 border border-gray-200"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {tag}
                {editing && (
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {editing && (
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nuevo tag..."
                  className="h-6 w-32 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  onClick={addTag}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons + errors in edit mode */}
      {editing && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5"
              data-testid="btn-save-customer"
            >
              {saving ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1.5"
              data-testid="btn-cancel-edit"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {validationError}
            </div>
          )}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
        </div>
      )}

      {/* Historial Médico & Medidas — replaces "Acerca de la clienta" */}
      <HistorialMedico
        tenantSlug={tenantSlug}
        customerId={customerId}
        initialData={{
          musicaFavorita:
            (customer as any).medicalHistory?.musicaFavorita || "",
          snackFavorito: (customer as any).medicalHistory?.snackFavorito || "",
          enfermedades: (customer as any).medicalHistory?.enfermedades || {},
          contraindicaciones:
            (customer as any).medicalHistory?.contraindicaciones || "",
          medidas: (customer as any).medicalHistory?.medidas || {},
          formaUna: (customer as any).medicalHistory?.formaUna || "",
          largoDeseado: (customer as any).medicalHistory?.largoDeseado || "",
          notasGenerales: customer.generalNotes || "",
        }}
        onSave={async (historialData: HistorialMedicoData) => {
          const { notasGenerales, ...medicinaFields } = historialData;
          const currentMedical = (customer as any).medicalHistory || {};
          const response = await fetch(
            `/api/tenants/${tenantSlug}/customers/${customerId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                generalNotes: notasGenerales,
                medicalHistory: {
                  ...currentMedical,
                  ...medicinaFields,
                },
              }),
            },
          );
          if (!response.ok) throw new Error("Failed to save historial médico");
          const updated = await response.json();
          setCustomer(updated.customer);
        }}
      />
    </div>
  );
});

export default CustomerFileHeader;
