"use client";

import { useEffect, useState, useCallback } from "react";

interface CheckResult {
  status: "ok" | "warn" | "error";
  latencyMs?: number;
  message?: string;
}

interface StatusData {
  status: "ok" | "warn" | "error";
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    ollama: CheckResult;
    n8n: CheckResult;
  };
}

const LABELS: Record<string, string> = {
  database: "Base de datos",
  ollama: "IA (Ollama)",
  n8n: "Automatización (n8n)",
};

const STATUS_COLOR = {
  ok: "bg-green-100 text-green-800 border-green-200",
  warn: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_DOT = {
  ok: "bg-green-500",
  warn: "bg-yellow-500",
  error: "bg-red-500",
};

const STATUS_LABEL = {
  ok: "Operativo",
  warn: "Degradado",
  error: "Error",
};

function CheckCard({ name, check }: { name: string; check: CheckResult }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${STATUS_COLOR[check.status]}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[check.status]}`} />
        <span className="font-medium">{LABELS[name] ?? name}</span>
        {check.message && <span className="opacity-70">— {check.message}</span>}
      </div>
      <div className="flex items-center gap-3">
        {check.latencyMs !== undefined && (
          <span className="opacity-60">{check.latencyMs} ms</span>
        )}
        <span className="font-semibold">{STATUS_LABEL[check.status]}</span>
      </div>
    </div>
  );
}

/**
 * StatusPanel — lightweight operational health panel for admin.
 * Calls /api/system/status (authenticated) and renders check results.
 * Auto-refreshes every 60 seconds.
 */
export function StatusPanel() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/system/status");
      if (resp.ok) {
        const json = await resp.json();
        setData(json);
        setLastChecked(new Date());
      }
    } catch {
      // silently fail — panel is informational, not critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const overall = data?.status ?? "ok";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${STATUS_DOT[overall]} ${loading ? "animate-pulse" : ""}`}
          />
          <h3 className="font-semibold text-gray-900">Estado del sistema</h3>
          {data && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[overall]}`}
            >
              {STATUS_LABEL[overall]}
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? "Verificando…" : "↻ Actualizar"}
        </button>
      </div>

      {/* Checks */}
      <div className="space-y-2 p-4">
        {data ? (
          Object.entries(data.checks).map(([name, check]) => (
            <CheckCard key={name} name={name} check={check} />
          ))
        ) : (
          <div className="space-y-2">
            {["database", "ollama", "n8n"].map((k) => (
              <div
                key={k}
                className="h-11 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {lastChecked && (
        <div className="border-t border-gray-100 px-5 py-2 text-xs text-gray-400">
          Última verificación:{" "}
          {lastChecked.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
          {data?.version && ` · v${data.version}`}
        </div>
      )}
    </div>
  );
}
