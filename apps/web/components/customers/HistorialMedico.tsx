"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { ChevronDown, ChevronUp, Music, Ruler, Sparkles } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface HistorialMedicoData {
  musicaFavorita?: string;
  snackFavorito?: string;
  enfermedades?: {
    diabetes?: boolean;
    psoriasis?: boolean;
    dermatitis?: boolean;
    otras?: string;
  };
  contraindicaciones?: string;
  medidas?: {
    pulgar?: { tips?: string; gel?: string; dualform?: string };
    indice?: { tips?: string; gel?: string; dualform?: string };
    medio?: { tips?: string; gel?: string; dualform?: string };
    anular?: { tips?: string; gel?: string; dualform?: string };
    menique?: { tips?: string; gel?: string; dualform?: string };
  };
  formaUna?: "cuadrada" | "coffin" | "almond" | "stiletto" | "";
  largoDeseado?: "corto" | "medio" | "largo" | "";
  notasGenerales?: string;
}

// Ref handle exposed to parent
export interface HistorialMedicoHandle {
  save: () => Promise<void>;
}

interface HistorialMedicoProps {
  tenantSlug: string;
  customerId: string;
  initialData?: HistorialMedicoData;
  onSave: (data: HistorialMedicoData) => Promise<void>;
}

const DEDOS = ["pulgar", "indice", "medio", "anular", "menique"] as const;
type Dedo = typeof DEDOS[number];
const DEDO_LABELS: Record<Dedo, string> = {
  pulgar: "Pulgar",
  indice: "Índice",
  medio: "Medio",
  anular: "Anular",
  menique: "Meñique",
};
const TECNICAS = ["tips", "gel", "dualform"] as const;
type Tecnica = typeof TECNICAS[number];
const TECNICA_LABELS: Record<Tecnica, string> = {
  tips: "Tips",
  gel: "Gel",
  dualform: "Dual Form",
};

const FORMAS_UNA = [
  { value: "cuadrada", label: "Cuadrada", emoji: "⬜" },
  { value: "coffin", label: "Coffin", emoji: "⚰️" },
  { value: "almond", label: "Almond", emoji: "🪐" },
  { value: "stiletto", label: "Stiletto", emoji: "✨" },
] as const;

const LARGOS_UNA = [
  { value: "corto", label: "Corto" },
  { value: "medio", label: "Medio" },
  { value: "largo", label: "Largo" },
] as const;

// ─── Block Header ──────────────────────────────────────────────────────────
function BlockHeader({
  icon,
  title,
  collapsed,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 mb-4 cursor-pointer select-none"
      onClick={onToggle}
    >
      <span className="text-[#8B5CF6]">{icon}</span>
      <h3 className="font-serif text-[#5B21B6] text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <span className="ml-auto text-[#8B5CF6]">
        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </span>
    </div>
  );
}

// ─── Main Component (forwardRef) ────────────────────────────────────────────
const HistorialMedico = forwardRef<HistorialMedicoHandle, HistorialMedicoProps>(
  function HistorialMedico({ initialData = {}, onSave }, ref) {
    const [draft, setDraft] = useState<HistorialMedicoData>(initialData);

    // Sync when initialData changes (e.g. customer reloads)
    useEffect(() => {
      setDraft(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(initialData)]);

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
      preferencias: false,
      sanitario: false,
      medidas: true,
      estilo: false,
      notas: false,
    });
    const toggleSection = (key: string) =>
      setCollapsedSections((s) => ({ ...s, [key]: !s[key] }));

    // Expose save() to parent via ref
    useImperativeHandle(ref, () => ({
      save: async () => {
        await onSave(draft);
      },
    }));

    const setMedida = (dedo: Dedo, tecnica: Tecnica, value: string) => {
      setDraft((prev) => ({
        ...prev,
        medidas: {
          ...prev.medidas,
          [dedo]: {
            ...(prev.medidas?.[dedo] || {}),
            [tecnica]: value,
          },
        },
      }));
    };

    const setEnfermedad = (
      key: keyof NonNullable<HistorialMedicoData["enfermedades"]>,
      value: boolean | string,
    ) => {
      setDraft((prev) => ({
        ...prev,
        enfermedades: { ...prev.enfermedades, [key]: value },
      }));
    };

    return (
      <div className="border-t border-[#EDE9FE] pt-5 mt-2">
        {/* Section Title */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[#7C3AED] text-lg">🧬</span>
          <h3 className="font-serif text-[#5B21B6] text-lg font-bold">
            Historial Médico & Medidas
          </h3>
        </div>

        <div className="space-y-5">
          {/* ── Preferencias ─────────────────────────────────────── */}
          <div className="bg-[#FAFAFE] rounded-xl border border-[#EDE9FE] p-4">
            <BlockHeader
              icon={<Music className="h-4 w-4" />}
              title="Preferencias"
              collapsed={collapsedSections.preferencias}
              onToggle={() => toggleSection("preferencias")}
            />
            {!collapsedSections.preferencias && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#7C3AED] font-medium mb-1">
                    🎵 Música favorita
                  </label>
                  <input
                    type="text"
                    value={draft.musicaFavorita || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, musicaFavorita: e.target.value }))}
                    placeholder="Ej: Reggaeton, Pop..."
                    className="w-full text-sm px-3 py-2 border border-[#DDD6FE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7C3AED] font-medium mb-1">
                    🍿 Snack favorito
                  </label>
                  <input
                    type="text"
                    value={draft.snackFavorito || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, snackFavorito: e.target.value }))}
                    placeholder="Ej: Papas, Gomitas..."
                    className="w-full text-sm px-3 py-2 border border-[#DDD6FE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Control Sanitario ────────────────────────────────── */}
          <div className="bg-[#FFF7F7] rounded-xl border border-[#FEE2E2] p-4">
            <BlockHeader
              icon={<span className="text-base">⚕️</span>}
              title="Control Sanitario"
              collapsed={collapsedSections.sanitario}
              onToggle={() => toggleSection("sanitario")}
            />
            {!collapsedSections.sanitario && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-red-600 font-medium mb-2">Enfermedades / Condiciones</p>
                  <div className="flex flex-wrap gap-3">
                    {(["diabetes", "psoriasis", "dermatitis"] as const).map((enf) => (
                      <label
                        key={enf}
                        className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-2 border transition-colors ${
                          draft.enfermedades?.[enf]
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!draft.enfermedades?.[enf]}
                          onChange={(e) => setEnfermedad(enf, e.target.checked)}
                          className="accent-red-500 h-4 w-4"
                        />
                        <span className="text-sm">{enf.charAt(0).toUpperCase() + enf.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-red-600 font-medium mb-1">Otras condiciones</label>
                  <input
                    type="text"
                    value={draft.enfermedades?.otras || ""}
                    onChange={(e) => setEnfermedad("otras", e.target.value)}
                    placeholder="Ej: Hipertensión, embarazo..."
                    className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-red-600 font-medium mb-1">
                    Contraindicaciones / Observaciones
                  </label>
                  <textarea
                    value={draft.contraindicaciones || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, contraindicaciones: e.target.value }))}
                    rows={2}
                    placeholder="Alergias a productos, reacciones previas..."
                    className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Medidas por dedo ─────────────────────────────────── */}
          <div className="bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] p-4">
            <BlockHeader
              icon={<Ruler className="h-4 w-4 text-green-600" />}
              title="Medidas por Dedo (mm)"
              collapsed={collapsedSections.medidas}
              onToggle={() => toggleSection("medidas")}
            />
            {!collapsedSections.medidas && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-3 text-xs font-semibold text-green-700 w-24">Dedo</th>
                      {TECNICAS.map((t) => (
                        <th key={t} className="text-center py-2 px-2 text-xs font-semibold text-green-700">
                          {TECNICA_LABELS[t]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {DEDOS.map((dedo) => (
                      <tr key={dedo} className="hover:bg-green-50/50">
                        <td className="py-2 pr-3 font-medium text-gray-700 text-xs">{DEDO_LABELS[dedo]}</td>
                        {TECNICAS.map((tecnica) => (
                          <td key={tecnica} className="py-2 px-2 text-center">
                            <input
                              type="text"
                              value={draft.medidas?.[dedo]?.[tecnica] || ""}
                              onChange={(e) => setMedida(dedo, tecnica, e.target.value)}
                              placeholder="—"
                              className="w-16 text-center text-sm px-1 py-1 border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Estilo Preferido ─────────────────────────────────── */}
          <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-4">
            <BlockHeader
              icon={<Sparkles className="h-4 w-4 text-amber-500" />}
              title="Estilo Preferido"
              collapsed={collapsedSections.estilo}
              onToggle={() => toggleSection("estilo")}
            />
            {!collapsedSections.estilo && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-amber-700 font-medium mb-2">Forma de uña</p>
                  <div className="flex flex-wrap gap-2">
                    {FORMAS_UNA.map((forma) => (
                      <button
                        key={forma.value}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            formaUna: p.formaUna === forma.value ? "" : forma.value,
                          }))
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          draft.formaUna === forma.value
                            ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                            : "bg-white border-amber-200 text-gray-600 hover:border-amber-300"
                        }`}
                      >
                        <span>{forma.emoji}</span>
                        {forma.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium mb-2">Largo deseado</p>
                  <div className="flex gap-2">
                    {LARGOS_UNA.map((largo) => (
                      <button
                        key={largo.value}
                        type="button"
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            largoDeseado: p.largoDeseado === largo.value ? "" : largo.value,
                          }))
                        }
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          draft.largoDeseado === largo.value
                            ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                            : "bg-white border-amber-200 text-gray-600 hover:border-amber-300"
                        }`}
                      >
                        {largo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Notas Generales ───────────────────────────────────── */}
          <div className="bg-[#F8F7FF] rounded-xl border border-[#E4E0FF] p-4">
            <BlockHeader
              icon={<span className="text-base">📝</span>}
              title="Notas Generales"
              collapsed={collapsedSections.notas}
              onToggle={() => toggleSection("notas")}
            />
            {!collapsedSections.notas && (
              <textarea
                value={draft.notasGenerales || ""}
                onChange={(e) => setDraft((p) => ({ ...p, notasGenerales: e.target.value }))}
                rows={3}
                placeholder="Notas sobre preferencias, observaciones especiales..."
                className="w-full text-sm px-3 py-2 border border-[#DDD6FE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40 bg-white resize-none"
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default HistorialMedico;
