"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminRouteGuard from "@/components/auth/AdminRouteGuard";

type SessionRow = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  maxCapacity: number;
  enrollmentCount: number;
  status: string;
  location?: string | null;
};

const emptyForm = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  maxCapacity: 8,
  location: "",
};

export default function SessionsAdminClient({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SessionRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const parseList = (json: unknown): SessionRow[] => {
    if (!json || typeof json !== "object") return [];
    const o = json as { success?: boolean; data?: SessionRow[] };
    if (o.success && Array.isArray(o.data)) return o.data;
    return [];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/sessions`);
      if (!res.ok) throw new Error("load");
      const json = await res.json();
      setSessions(parseList(json));
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(10, 0, 0, 0);
    setForm({
      ...emptyForm,
      startsAt: tomorrow.toISOString().slice(0, 16),
      endsAt: end.toISOString().slice(0, 16),
    });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (s: SessionRow) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description ?? "",
      startsAt: new Date(s.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(s.endsAt).toISOString().slice(0, 16),
      maxCapacity: s.maxCapacity,
      location: s.location ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    setError(null);
    const payload = {
      title: form.title,
      description: form.description || undefined,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      maxCapacity: Number(form.maxCapacity),
      location: form.location || undefined,
    };

    const url = editing
      ? `/api/tenants/${tenantSlug}/sessions/${editing.id}`
      : `/api/tenants/${tenantSlug}/sessions`;
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        (json as { error?: { message?: string } })?.error?.message ??
          "Error al guardar",
      );
      return;
    }
    setModalOpen(false);
    await load();
  };

  const remove = async (s: SessionRow) => {
    const force =
      s.enrollmentCount > 0
        ? window.confirm(
            "Hay alumnos inscritos. ¿Eliminar la sesión y cancelar inscripciones?",
          )
        : window.confirm("¿Eliminar esta sesión?");
    if (!force) return;

    const res = await fetch(
      `/api/tenants/${tenantSlug}/sessions/${s.id}?force=true`,
      { method: "DELETE" },
    );
    if (res.ok) await load();
  };

  return (
    <AdminRouteGuard tenantSlug={tenantSlug}>
      <div
        className="max-w-4xl mx-auto p-4 md:p-8"
        data-testid="admin-sessions-page"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-serif text-gray-900">
              Sesiones / Clases
            </h1>
            <p className="text-sm text-gray-500">
              Crear y gestionar clases grupales con cupo
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-amber-800 text-white px-4 py-2 rounded-md text-sm"
            data-testid="btn-new-session"
          >
            <Plus className="w-4 h-4" />
            Nueva sesión
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando…</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500" data-testid="admin-sessions-empty">
            No hay sesiones. Crea la primera clase.
          </p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="border rounded-lg p-4 flex justify-between items-start bg-white shadow-sm"
                data-testid={`admin-session-row-${s.id}`}
              >
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(s.startsAt).toLocaleString("es-MX")} · Cupo{" "}
                    {s.enrollmentCount}/{s.maxCapacity}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
              data-testid="session-form-modal"
            >
              <h2 className="text-lg font-semibold">
                {editing ? "Editar sesión" : "Nueva sesión"}
              </h2>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <label className="block text-sm">
                Título
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  data-testid="session-title-input"
                />
              </label>
              <label className="block text-sm">
                Descripción
                <textarea
                  className="mt-1 w-full border rounded px-3 py-2"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  Inicio
                  <input
                    type="datetime-local"
                    className="mt-1 w-full border rounded px-2 py-2"
                    value={form.startsAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startsAt: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  Fin
                  <input
                    type="datetime-local"
                    className="mt-1 w-full border rounded px-2 py-2"
                    value={form.endsAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endsAt: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="block text-sm">
                Cupo máximo
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.maxCapacity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxCapacity: Number(e.target.value),
                    }))
                  }
                  data-testid="session-capacity-input"
                />
              </label>
              <label className="block text-sm">
                Ubicación (cancha)
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm border rounded"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-amber-800 text-white rounded"
                  onClick={save}
                  data-testid="session-save-btn"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRouteGuard>
  );
}
