"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Users } from "lucide-react";

type EnrollmentRow = {
  id: string;
  customerName: string;
  present: boolean;
};

type SessionRow = {
  id: string;
  title: string;
  startsAt: string;
  maxCapacity: number;
  enrollmentCount: number;
  staffName?: string | null;
  enrollments?: EnrollmentRow[];
};

export interface SessionsTodaySectionProps {
  tenantSlug: string;
}

export default function SessionsTodaySection({
  tenantSlug,
}: SessionsTodaySectionProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/tenants/${tenantSlug}/sessions?date=today&status=scheduled`,
      );
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      const list =
        json?.success && Array.isArray(json.data)
          ? json.data
          : Array.isArray(json?.data)
            ? json.data
            : [];
      setSessions(list);
    } catch (e) {
      console.error("SessionsTodaySection:", e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const toggleAttendance = async (
    sessionId: string,
    enrollmentId: string,
    present: boolean,
  ) => {
    setSavingId(enrollmentId);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/sessions/${sessionId}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: [{ enrollmentId, present }],
          }),
        },
      );
      if (!res.ok) throw new Error("attendance failed");
      await loadSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div
        className="rounded-lg border border-indigo-50 bg-white p-4 shadow-sm"
        data-testid="sessions-today-loading"
      >
        <p className="text-sm text-gray-500">Cargando sesiones de hoy…</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-indigo-50 bg-white p-4 shadow-sm h-full"
      data-testid="sessions-today-section"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-700" />
          Sesiones de hoy
        </h2>
        <a
          href={`/t/${tenantSlug}/admin/sessions`}
          className="text-xs text-amber-800 hover:underline"
        >
          Ver todas
        </a>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500" data-testid="sessions-today-empty">
          No hay clases programadas para hoy.
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => {
            const expanded = expandedId === session.id;
            return (
              <li
                key={session.id}
                className="border border-gray-100 rounded-md overflow-hidden"
                data-testid={`session-card-${session.id}`}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-50/50"
                  onClick={() => setExpandedId(expanded ? null : session.id)}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(session.startsAt)}
                      {session.staffName ? ` · ${session.staffName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                    <span data-testid={`session-cupo-${session.id}`}>
                      {session.enrollmentCount}/{session.maxCapacity}
                    </span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="px-3 pb-3 border-t border-gray-50 bg-gray-50/50">
                    {(session.enrollments ?? []).length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">
                        Sin alumnos inscritos aún.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {(session.enrollments ?? []).map((enr) => (
                          <li
                            key={enr.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{enr.customerName}</span>
                            <button
                              type="button"
                              disabled={savingId === enr.id}
                              aria-label={`Asistencia ${enr.customerName}`}
                              data-testid={`attendance-${enr.id}`}
                              className={`p-1 rounded border ${
                                enr.present
                                  ? "bg-green-100 border-green-400 text-green-700"
                                  : "bg-white border-gray-300 text-gray-400"
                              }`}
                              onClick={() =>
                                toggleAttendance(
                                  session.id,
                                  enr.id,
                                  !enr.present,
                                )
                              }
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
