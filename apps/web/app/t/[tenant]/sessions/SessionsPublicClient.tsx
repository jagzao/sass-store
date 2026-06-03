"use client";

import { useCallback, useEffect, useState } from "react";

type SessionRow = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  maxCapacity: number;
  enrollmentCount: number;
  location?: string | null;
};

export default function SessionsPublicClient({
  tenantSlug,
}: {
  tenantSlug: string;
}) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/sessions?status=scheduled`,
      );
      const json = await res.json();
      const list =
        (json as { success?: boolean; data?: SessionRow[] }).success &&
        Array.isArray((json as { data?: SessionRow[] }).data)
          ? (json as { data: SessionRow[] }).data
          : [];
      const now = Date.now();
      setSessions(
        (Array.isArray(list) ? list : []).filter(
          (s) => new Date(s.startsAt).getTime() > now,
        ),
      );
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const enroll = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/sessions/${selectedId}/enrollments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: name,
            customerPhone: phone,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        const msg =
          (json as { error?: { message?: string } })?.error?.message ??
          "No se pudo completar la inscripción";
        setError(msg);
        return;
      }
      setMessage(
        "¡Inscripción exitosa! Te enviaremos un recordatorio por WhatsApp si proporcionaste tu teléfono.",
      );
      setName("");
      setPhone("");
      setSelectedId(null);
      await load();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-lg mx-auto p-6 min-h-[60vh]"
      data-testid="public-sessions-page"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Inscripción a clases
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Elige una sesión disponible y completa tus datos.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando sesiones…</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500" data-testid="public-sessions-empty">
          No hay clases abiertas por ahora.
        </p>
      ) : (
        <ul className="space-y-3 mb-8">
          {sessions.map((s) => {
            const full = s.enrollmentCount >= s.maxCapacity;
            const selected = selectedId === s.id;
            return (
              <li
                key={s.id}
                className={`border rounded-lg p-4 ${
                  selected ? "border-amber-600 bg-amber-50" : "border-gray-200"
                } ${full ? "opacity-60" : ""}`}
                data-testid={`public-session-${s.id}`}
              >
                <button
                  type="button"
                  disabled={full}
                  className="w-full text-left"
                  onClick={() => !full && setSelectedId(s.id)}
                >
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(s.startsAt).toLocaleString("es-MX")}
                    {s.location ? ` · ${s.location}` : ""}
                  </p>
                  <p className="text-xs mt-1 font-semibold text-amber-900">
                    {full
                      ? "Cupo agotado"
                      : `Cupo: ${s.enrollmentCount}/${s.maxCapacity}`}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedId && (
        <div
          className="border rounded-lg p-4 space-y-3 bg-white shadow-sm"
          data-testid="enrollment-form"
        >
          <h2 className="font-semibold text-gray-800">Tus datos</h2>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="enroll-name-input"
          />
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Teléfono (WhatsApp)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-testid="enroll-phone-input"
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700" data-testid="enroll-success">
              {message}
            </p>
          )}
          <button
            type="button"
            disabled={submitting || !name.trim() || phone.length < 10}
            onClick={enroll}
            className="w-full bg-amber-800 text-white py-2 rounded-md text-sm disabled:opacity-50"
            data-testid="enroll-submit-btn"
          >
            {submitting ? "Inscribiendo…" : "Confirmar inscripción"}
          </button>
        </div>
      )}
    </div>
  );
}
