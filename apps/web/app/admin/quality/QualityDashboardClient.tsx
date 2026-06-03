"use client";

import { useMemo } from "react";

interface Finding {
  severity: string;
  message: string;
  category?: string;
}

interface QualityData {
  qualityScore: number;
  documentation: number;
  agentsContract: number;
  testFilesDetected: number;
  backendEndpointsDetected: number;
  frontendRoutesDetected: number;
  ciPipelineDetected: boolean;
  lastScan: string;
  findings: Finding[];
}

function severityColor(severity: string) {
  const s = severity.toUpperCase();
  if (s === "P0" || s === "CRITICAL") return "bg-red-600";
  if (s === "P1" || s === "HIGH") return "bg-orange-500";
  if (s === "P2" || s === "MEDIUM") return "bg-yellow-500";
  return "bg-green-500";
}

function scoreColor(score: number) {
  if (score < 30) return "text-red-500";
  if (score < 70) return "text-yellow-500";
  return "text-green-500";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX");
  } catch {
    return iso;
  }
}

export function QualityDashboardClient({ data }: { data: unknown }) {
  const d = data as Partial<QualityData> | null;

  const findings = useMemo(() => {
    const raw = d?.findings ?? [];
    return raw.filter(
      (f) => !String(f.message).toLowerCase().includes("possible secrets"),
    );
  }, [d?.findings]);

  const metrics = useMemo(
    () => [
      {
        label: "Quality Score",
        value: `${d?.qualityScore ?? 0}/100`,
        accent: scoreColor(d?.qualityScore ?? 0),
      },
      {
        label: "Documentación",
        value: `${d?.documentation ?? 0}%`,
        accent: scoreColor(d?.documentation ?? 0),
      },
      {
        label: "Agent Contract",
        value: `${d?.agentsContract ?? 0}%`,
        accent: scoreColor(d?.agentsContract ?? 0),
      },
      {
        label: "Archivos de Tests",
        value: String(d?.testFilesDetected ?? 0),
        accent: "text-blue-400",
      },
      {
        label: "Frontend Routes",
        value: String(d?.frontendRoutesDetected ?? 0),
        accent: "text-purple-400",
      },
      {
        label: "Backend Endpoints",
        value: String(d?.backendEndpointsDetected ?? 0),
        accent: "text-indigo-400",
      },
      {
        label: "CI Pipeline",
        value: d?.ciPipelineDetected ? "Activo" : "Inactivo",
        accent: d?.ciPipelineDetected ? "text-green-400" : "text-red-400",
      },
      {
        label: "Último Scan",
        value: formatDate(d?.lastScan ?? ""),
        accent: "text-gray-300",
      },
    ],
    [d],
  );

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-white/10 bg-[#121212] p-4"
          >
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
              {m.label}
            </p>
            <p className={`text-2xl font-bold ${m.accent}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Findings Table */}
      <div className="rounded-lg border border-white/10 bg-[#121212] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Hallazgos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Severidad</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Mensaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {findings.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Sin hallazgos registrados
                  </td>
                </tr>
              ) : (
                findings.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold text-white ${severityColor(f.severity)}`}
                      >
                        {f.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{f.category ?? "-"}</td>
                    <td className="px-4 py-3">{f.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
