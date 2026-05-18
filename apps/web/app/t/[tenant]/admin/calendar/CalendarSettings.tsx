"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DAY_KEYS,
  DAY_LABELS,
  defaultOperatingHours,
  type DayKey,
  type OperatingHoursConfig,
  type TimeRange,
} from "@/lib/calendar/operating-hours";

const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

interface CalendarSettingsProps {
  tenantSlug: string;
  onSaved?: (config: OperatingHoursConfig) => void;
}

export function CalendarSettings({
  tenantSlug,
  onSaved,
}: CalendarSettingsProps) {
  const [config, setConfig] = useState<OperatingHoursConfig>(
    defaultOperatingHours(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<DayKey>("mon");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/calendar/settings`);
      if (!res.ok) throw new Error("No se pudo cargar");
      const json = await res.json();
      setConfig(json.data ?? defaultOperatingHours());
    } catch {
      setConfig(defaultOperatingHours());
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRange = (
    day: DayKey,
    index: number,
    field: keyof TimeRange,
    value: string,
  ) => {
    setConfig((prev) => {
      const ranges = [...(prev.days[day] ?? [])];
      ranges[index] = { ...ranges[index], [field]: value };
      return { ...prev, days: { ...prev.days, [day]: ranges } };
    });
  };

  const addRange = (day: DayKey) => {
    setConfig((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: [...(prev.days[day] ?? []), { start: "09:00", end: "13:00" }],
      },
    }));
  };

  const removeRange = (day: DayKey, index: number) => {
    setConfig((prev) => {
      const ranges = [...(prev.days[day] ?? [])];
      ranges.splice(index, 1);
      return { ...prev, days: { ...prev.days, [day]: ranges } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/calendar/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }
      const json = await res.json();
      setConfig(json.data);
      onSaved?.(json.data);
      toast.success("Horarios de operación guardados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const dayRanges = config.days[activeDay] ?? [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-h-[70vh] overflow-y-auto w-[380px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Configuración del Calendario
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Define uno o más bloques por día (ej. 9:00–13:00 y 16:00–21:00).
      </p>

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Cargando…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 mb-4">
            {DAY_KEYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  activeDay === day
                    ? "bg-[#C5A059]/15 border-[#C5A059] text-[#333333] font-medium"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {DAY_LABELS[day].slice(0, 3)}
              </button>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-[#C5A059] mb-3">
            {DAY_LABELS[activeDay]}
          </h4>

          {dayRanges.length === 0 ? (
            <p className="text-sm text-gray-500 mb-3">Cerrado este día.</p>
          ) : (
            <div className="space-y-3 mb-3">
              {dayRanges.map((range, index) => (
                <div
                  key={`${activeDay}-${index}`}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-gray-500">Desde</label>
                    <Select
                      value={range.start}
                      onValueChange={(v) =>
                        updateRange(activeDay, index, "start", v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-gray-500">Hasta</label>
                    <Select
                      value={range.end}
                      onValueChange={(v) =>
                        updateRange(activeDay, index, "end", v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRange(activeDay, index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md mb-0.5"
                    aria-label="Eliminar bloque"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => addRange(activeDay)}
            className="flex items-center gap-1 text-sm text-[#C5A059] hover:text-[#B08D45] mb-4"
          >
            <Plus className="w-4 h-4" />
            Agregar bloque horario
          </button>

          <div className="space-y-2 border-t border-gray-100 pt-4">
            <label className="text-xs text-gray-600">
              Intervalo de la grilla (minutos)
            </label>
            <Select
              value={String(config.intervalMinutes)}
              onValueChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  intervalMinutes: Number(v),
                }))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["15", "30", "45", "60"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-500">
          Los cambios aplican al calendario y reservas públicas.
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="px-4 py-2 text-sm rounded-md bg-[#C5A059] text-white hover:bg-[#B08D45] disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? "Guardando…" : "Guardar ajustes"}
        </button>
      </div>
    </div>
  );
}
