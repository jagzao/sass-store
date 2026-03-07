"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Plus, Trash2 } from "lucide-react";
import FormSelect from "@/components/ui/forms/FormSelect";

interface CustomerFormProps {
  tenantSlug: string;
  customerId?: string;
  onSuccess?: () => void;
  initialData?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    generalNotes?: string;
    tags?: string[];
    status?: "active" | "inactive" | "blocked";
    birthday?: string;
    medicalHistory?: {
      conditions?: string[];
      allergies?: string[];
      medications?: string;
    };
  };
}

export default function CustomerForm({
  tenantSlug,
  customerId,
  onSuccess,
  initialData,
}: CustomerFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [generalNotes, setGeneralNotes] = useState(
    initialData?.generalNotes || "",
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "blocked">(
    initialData?.status || "active",
  );
  
  // New Fields: Birthday and Medical History
  const [birthday, setBirthday] = useState(
    initialData?.birthday ? initialData.birthday.split("T")[0] : "",
  );
  const [conditionsTag, setConditionsTag] = useState("");
  const [conditions, setConditions] = useState<string[]>(
    initialData?.medicalHistory?.conditions || [],
  );
  const [allergiesTag, setAllergiesTag] = useState("");
  const [allergies, setAllergies] = useState<string[]>(
    initialData?.medicalHistory?.allergies || [],
  );
  const [medications, setMedications] = useState(
    initialData?.medicalHistory?.medications || "",
  );

  const handleAddCondition = () => {
    if (conditionsTag.trim() && !conditions.includes(conditionsTag.trim())) {
      setConditions([...conditions, conditionsTag.trim()]);
      setConditionsTag("");
    }
  };
  
  const handleRemoveCondition = (conditionToRemove: string) => {
    setConditions(conditions.filter((c) => c !== conditionToRemove));
  };
  
  const handleAddAllergy = () => {
    if (allergiesTag.trim() && !allergies.includes(allergiesTag.trim())) {
      setAllergies([...allergies, allergiesTag.trim()]);
      setAllergiesTag("");
    }
  };
  
  const handleRemoveAllergy = (allergyToRemove: string) => {
    setAllergies(allergies.filter((a) => a !== allergyToRemove));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        generalNotes: generalNotes.trim() || undefined,
        tags,
        status,
        birthday: birthday || undefined,
        medicalHistory: {
          conditions,
          allergies,
          medications: medications.trim(),
        },
      };

      const url = customerId
        ? `/api/tenants/${tenantSlug}/customers/${customerId}`
        : `/api/tenants/${tenantSlug}/customers`;

      const method = customerId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.customer || !data.customer.id) {
        throw new Error(
          "La respuesta del servidor no contiene los datos esperados de la clienta",
        );
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to customer file page
        router.push(`/t/${tenantSlug}/clientes/${data.customer.id}`);
      }
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(
        err instanceof Error ? err.message : "Error al guardar la clienta",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/t/${tenantSlug}/clientes`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: María García López"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 555-1234"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: maria@example.com"
          />
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Cumpleaños
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección (Opcional)
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Calle Principal 123, Colonia Centro, Ciudad"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <FormSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: "active", label: "Activa" },
              { value: "inactive", label: "Inactiva" },
              { value: "blocked", label: "Bloqueada" },
            ]}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etiquetas (Alergias, Preferencias, etc.)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Alérgica a acetona"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-purple-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* General Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Generales
          </label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notas sobre preferencias especiales..."
          />
        </div>

        {/* SECTION: MEDICAL HISTORY */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚕️ Historial Médico</h3>
          
          <div className="space-y-5">
            {/* Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condiciones Médicas (Diabetes, Psoriasis, Dermatitis, etc.)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={conditionsTag}
                  onChange={(e) => setConditionsTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCondition();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ej: Diabetes Tipo 2"
                />
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              {conditions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                    >
                      {condition}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(condition)}
                        className="hover:text-red-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alergias Conocidas
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={allergiesTag}
                  onChange={(e) => setAllergiesTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAllergy();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej: Acrilato, Polvo"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="hover:text-amber-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medicamentos Actuales
              </label>
              <textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Registra si el paciente está tomando algún medicamento o tratamiento médico relevant..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim() || !phone.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {submitting
            ? "Guardando..."
            : customerId
              ? "Guardar Cambios"
              : "Crear Clienta"}
        </button>
      </div>
    </form>
  );
}
