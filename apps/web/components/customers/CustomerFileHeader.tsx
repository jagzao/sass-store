"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  generalNotes?: string;
  tags: string[];
  status: "active" | "inactive" | "blocked";
}

interface CustomerFileHeaderProps {
  tenantSlug: string;
  customerId: string;
}

export default function CustomerFileHeader({
  tenantSlug,
  customerId,
}: CustomerFileHeaderProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
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
          throw new Error("No se encontraron datos de la clienta");
        }

        setCustomer(data.customer);
        setEditedNotes(data.customer.generalNotes || "");
        setEditedName(data.customer.name || "");
        setEditedPhone(data.customer.phone || "");
        setEditedAddress(data.customer.address || "");
        setEditedTags(data.customer.tags || []);
      } catch (error) {
        console.error("Error fetching customer:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Error al cargar la información de la clienta",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [tenantSlug, customerId]);

  const handleSave = async () => {
    if (!customer) return;

    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editedName,
            phone: editedPhone,
            address: editedAddress,
            generalNotes: editedNotes,
            tags: editedTags,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update customer");

      const updatedData = await response.json();

      setCustomer(updatedData.customer);
      setEditing(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Error al guardar los cambios");
    }
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

      // Use window.location.href to ensure a hard refresh and avoid stale cache
      window.location.href = `/t/${tenantSlug}/clientes`;
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error al eliminar la clienta");
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
                "No se pudo cargar la información de la clienta. Por favor, intente nuevamente."}
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
                          : "Error al cargar la información de la clienta",
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
                Volver a clientas
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
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <Input
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      placeholder="Dirección completa"
                      className="h-8"
                    />
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

        {/* Status Badge */}
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={`ml-4 p-2 rounded-full transition-colors ${
                isLuxury
                  ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                  : "text-red-400 hover:text-red-600 hover:bg-red-50"
              }`}
              title="Eliminar clienta"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Está seguro de eliminar esta clienta?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                la clienta "{customer.name}" y todo su historial de visitas y
                servicios.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className={buttonVariants({ variant: "destructive" })}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

      {/* General Notes */}
      <div
        className={`border-t pt-4 ${isLuxury ? "border-[#D4AF37]/10" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-sm font-medium ${isLuxury ? "text-[#b3932d]" : "text-gray-700"}`}
          >
            Acerca de la clienta
          </h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className={`text-sm ${isLuxury ? "text-[#b3932d] hover:text-[#8a7022]" : "text-blue-600 hover:text-blue-800"} flex items-center gap-1 transition-colors`}
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={`text-sm ${isLuxury ? "text-green-600 hover:text-green-700" : "text-green-600 hover:text-green-800"} flex items-center gap-1`}
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedNotes(customer.generalNotes || "");
                }}
                className={`text-sm ${isLuxury ? "text-gray-500 hover:text-gray-700" : "text-gray-600 hover:text-gray-800"} flex items-center gap-1`}
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
              isLuxury
                ? "bg-white border-gray-200 text-gray-800 focus:ring-[#D4AF37] placeholder-gray-400"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Notas sobre preferencias, alergias, observaciones especiales..."
          />
        ) : (
          <p
            className={`text-sm whitespace-pre-wrap ${isLuxury ? "text-gray-600" : "text-gray-600"}`}
          >
            {customer.generalNotes || "Sin notas"}
          </p>
        )}
      </div>
    </div>
  );
}
