"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  X,
  PlusCircle,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Pill,
  Tag,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";
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
    <form
      onSubmit={handleSubmit}
      className="rounded-lg shadow p-6"
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      {error && (
        <div
          className="mb-6 rounded-lg p-4"
          style={{ backgroundColor: "var(--color-error)", opacity: 0.1 }}
        >
          <p className="text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-muted-foreground)" }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-label="Nombre Completo"
            className="w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] theme-input"
            placeholder="Nombre completo *"
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-muted-foreground)" }}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            aria-label="Teléfono"
            className="w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] theme-input"
            placeholder="Teléfono *"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-muted-foreground)" }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            className="w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] theme-input"
            placeholder="Email (opcional)"
          />
        </div>

        {/* Birthday */}
        <div className="relative">
          <Calendar
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-muted-foreground)" }}
          />
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            aria-label="Fecha de Cumpleaños"
            className="w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] theme-input"
          />
        </div>

        {/* Address */}
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-3 top-3 h-4 w-4"
            style={{ color: "var(--color-muted-foreground)" }}
          />
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            aria-label="Dirección"
            className="w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] theme-input"
            placeholder="Dirección (opcional)"
          />
        </div>

        {/* Status */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-muted-foreground)" }}
          >
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
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Tag
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--color-muted-foreground)" }}
              />
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
                aria-label="Etiquetas"
                className="w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] theme-input"
                placeholder="Etiquetas (alergias, preferencias...)"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              title="Agregar etiqueta"
              aria-label="Agregar etiqueta"
              className="px-3 py-2 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#FFFFFF",
              }}
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                    color: "var(--color-foreground)",
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* General Notes */}
        <div className="relative">
          <FileText
            className="pointer-events-none absolute left-3 top-3 h-4 w-4"
            style={{ color: "var(--color-muted-foreground)" }}
          />
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={4}
            aria-label="Notas Generales"
            className="theme-input w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
            placeholder="Notas generales..."
          />
        </div>

        {/* SECTION: MEDICAL HISTORY */}
        <div
          className="pt-6 mt-6 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h3
            className="text-lg font-medium mb-4"
            style={{ color: "var(--color-foreground)" }}
          >
            ⚕️ Historial Médico
          </h3>

          <div className="space-y-5">
            {/* Conditions */}
            <div>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <HeartPulse
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--color-muted-foreground)" }}
                  />
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
                    aria-label="Condiciones Médicas"
                    className="theme-input w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    placeholder="Condiciones médicas (Diabetes, Psoriasis...)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  title="Agregar condición"
                  aria-label="Agregar condición"
                  className="px-3 py-2 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: "var(--color-error, #dc2626)" }}
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>
              {conditions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--color-error, #dc2626) 18%, transparent)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      {condition}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(condition)}
                        style={{ color: "var(--color-muted-foreground)" }}
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
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <AlertTriangle
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--color-muted-foreground)" }}
                  />
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
                    aria-label="Alergias Conocidas"
                    className="theme-input w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                    placeholder="Alergias conocidas..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  title="Agregar alergia"
                  aria-label="Agregar alergia"
                  className="px-3 py-2 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: "var(--color-warning, #d97706)" }}
                >
                  <PlusCircle className="h-5 w-5" />
                </button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--color-warning, #d97706) 18%, transparent)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        style={{ color: "var(--color-muted-foreground)" }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="relative">
              <Pill
                className="pointer-events-none absolute left-3 top-3 h-4 w-4"
                style={{ color: "var(--color-muted-foreground)" }}
              />
              <textarea
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                rows={2}
                aria-label="Medicamentos Actuales"
                className="theme-input w-full pl-9 px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                placeholder="Medicamentos actuales..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex justify-end gap-3 mt-8 pt-6 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            backgroundColor: "var(--color-background)",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim() || !phone.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#FFFFFF",
          }}
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
