"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@sass-store/ui/components/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onClose: () => void;
  tenantSlug: string;
}

const TRIGGER_OPTIONS = [
  {
    value: "booking_confirmed",
    label: "Cita confirmada",
    desc: "Se envía cuando se confirma una reserva",
  },
  {
    value: "booking_cancelled",
    label: "Cita cancelada",
    desc: "Se envía cuando se cancela una reserva",
  },
  {
    value: "after_visit",
    label: "Después de visita",
    desc: "Se envía tras registrar una visita completada",
  },
  {
    value: "customer_inactive_30d",
    label: "Cliente inactivo 30 días",
    desc: "Cron diario — clientes sin visita en 30 días",
  },
  {
    value: "birthday",
    label: "Cumpleaños",
    desc: "Cron diario — clientes con cumpleaños hoy",
  },
];

const ACTION_OPTIONS = [
  { value: "send_text", label: "Enviar mensaje de texto" },
  { value: "send_template", label: "Enviar plantilla aprobada" },
  { value: "escalate", label: "Escalar a humano (notificar admin)" },
];

export function AutomationCreateDialog({ open, onClose, tenantSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    triggerEvent: "",
    actionType: "send_text",
    message: "",
    templateId: "",
    delayMinutes: "0",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const actionConfig: Record<string, unknown> = {
        delayMinutes: parseInt(form.delayMinutes, 10) || 0,
      };
      if (form.actionType === "send_text") actionConfig.message = form.message;
      if (form.actionType === "send_template")
        actionConfig.templateId = form.templateId;

      await fetch(`/api/tenants/${tenantSlug}/whatsapp/automations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          triggerEvent: form.triggerEvent,
          actionType: form.actionType,
          actionConfig,
          enabled: true,
        }),
      });
      router.refresh();
      onClose();
      setForm({
        name: "",
        triggerEvent: "",
        actionType: "send_text",
        message: "",
        templateId: "",
        delayMinutes: "0",
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedTrigger = TRIGGER_OPTIONS.find(
    (t) => t.value === form.triggerEvent,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva automatización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">Nombre de la regla</Label>
            <Input
              id="rule-name"
              placeholder="ej. Recordatorio post-visita"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cuándo se activa</Label>
            <Select
              value={form.triggerEvent}
              onValueChange={(v) => set("triggerEvent", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento..." />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTrigger && (
              <p className="text-xs text-muted-foreground">
                {selectedTrigger.desc}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Delay (minutos después del evento)</Label>
            <Input
              type="number"
              min={0}
              max={10080}
              value={form.delayMinutes}
              onChange={(e) => set("delayMinutes", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              0 = inmediato · 60 = 1 hora · 1440 = 1 día
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Acción</Label>
            <Select
              value={form.actionType}
              onValueChange={(v) => set("actionType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.actionType === "send_text" && (
            <div className="space-y-1.5">
              <Label>Mensaje</Label>
              <Textarea
                placeholder="Hola {{nombre}}, gracias por tu visita..."
                rows={3}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Variables: {"{{nombre}}"} {"{{servicio}}"} {"{{fecha}}"}
              </p>
            </div>
          )}

          {form.actionType === "send_template" && (
            <div className="space-y-1.5">
              <Label>ID de plantilla (aprobada en Meta)</Label>
              <Input
                placeholder="booking_reminder_24h"
                value={form.templateId}
                onChange={(e) => set("templateId", e.target.value)}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.triggerEvent}>
              {loading ? "Guardando..." : "Crear regla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
