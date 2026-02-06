"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

const DURATIONS = [
  { label: "30 min", value: "30" },
  { label: "45 min", value: "45" },
  { label: "60 min", value: "60" },
  { label: "90 min", value: "90" },
];

const INTERVALS = [
  { label: "0 min", value: "0" },
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
];

const WORKING_DAYS = [
  { label: "Lunes", value: "mon" },
  { label: "Martes", value: "tue" },
  { label: "Miércoles", value: "wed" },
  { label: "Jueves", value: "thu" },
  { label: "Viernes", value: "fri" },
  { label: "Sábado", value: "sat" },
  { label: "Domingo", value: "sun" },
];

export function CalendarSettings() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Configuración del Calendario
      </h3>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Horario de operación
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Apertura</label>
                  <Select defaultValue="09:00">
                    <SelectTrigger>
                      <SelectValue placeholder="Hora de apertura" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Cierre</label>
                  <Select defaultValue="19:00">
                    <SelectTrigger>
                      <SelectValue placeholder="Hora de cierre" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Días laborables
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {WORKING_DAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={
                        day.value !== "sun" && day.value !== "sat"
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-gray-600">
                  Duración de citas
                </label>
                <Select defaultValue="60">
                  <SelectTrigger>
                    <SelectValue placeholder="Duración" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-600">
                  Intervalo entre citas
                </label>
                <Select defaultValue="10">
                  <SelectTrigger>
                    <SelectValue placeholder="Intervalo" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="policies">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Notas para clientes
              </h4>
              <Textarea
                placeholder="Ej. Llegar 10 minutos antes, cancelar con 24h de anticipación..."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Confirmación automática
                </div>
                <div className="text-xs text-gray-500">
                  Aprueba automáticamente citas en horario disponible.
                </div>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Cambios locales (pendiente de guardar)
        </span>
        <button className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
          Guardar ajustes
        </button>
      </div>
    </div>
  );
}
