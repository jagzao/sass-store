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

export function CampaignCreateDialog({ open, onClose, tenantSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    audienceType: "all",
    message: "",
    scheduledAt: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/tenants/${tenantSlug}/whatsapp/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          audienceType: form.audienceType,
          message: form.message,
          scheduledAt: form.scheduledAt || null,
        }),
      });
      router.refresh();
      onClose();
      setForm({ name: "", audienceType: "all", message: "", scheduledAt: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva campaña de WhatsApp</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre de la campaña</Label>
            <Input
              id="name"
              placeholder="ej. Promo de verano"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audience">Audiencia</Label>
            <Select
              value={form.audienceType}
              onValueChange={(v) => setForm((p) => ({ ...p, audienceType: v }))}
            >
              <SelectTrigger id="audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                <SelectItem value="segment">
                  Segmento (últimas visitas)
                </SelectItem>
                <SelectItem value="manual">Lista manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              placeholder="Hola {{nombre}}, tenemos una promo especial para ti..."
              rows={3}
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Usa {"{{nombre}}"} para personalizar con el nombre del cliente.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduled">Programar envío (opcional)</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                setForm((p) => ({ ...p, scheduledAt: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear campaña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
