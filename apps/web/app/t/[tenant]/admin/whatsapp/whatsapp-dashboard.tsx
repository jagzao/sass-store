"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@sass-store/ui/components/badge";
import { Button } from "@sass-store/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sass-store/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Megaphone,
  Zap,
  Settings,
  Plus,
  CheckCircle2,
  Trash2,
  Power,
} from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type {
  waCampaigns,
  waAutomationRules,
  waTenantConfig,
  tenants,
} from "@sass-store/database/schema";
import { CampaignCreateDialog } from "./campaign-create-dialog";
import { AutomationCreateDialog } from "./automation-create-dialog";

type Campaign = InferSelectModel<typeof waCampaigns>;
type Rule = InferSelectModel<typeof waAutomationRules>;
type WAConfig = InferSelectModel<typeof waTenantConfig>;
type Tenant = Pick<InferSelectModel<typeof tenants>, "id" | "name" | "slug">;

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  draft: { label: "Borrador", variant: "outline" },
  scheduled: { label: "Programada", variant: "secondary" },
  sending: { label: "Enviando...", variant: "default" },
  completed: { label: "Completada", variant: "default" },
  failed: { label: "Fallida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "outline" },
};

const TRIGGER_LABELS: Record<string, string> = {
  booking_confirmed: "Cita confirmada",
  booking_cancelled: "Cita cancelada",
  customer_inactive_30d: "Cliente inactivo 30 días",
  after_visit: "Después de visita",
  birthday: "Cumpleaños",
};

export function WhatsAppDashboard({
  tenant,
  config,
  campaigns,
  rules,
}: {
  tenant: Tenant;
  config: WAConfig | null;
  campaigns: Campaign[];
  rules: Rule[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [localRules, setLocalRules] = useState(rules);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "sending",
  ).length;
  const completedCampaigns = campaigns.filter(
    (c) => c.status === "completed",
  ).length;
  const activeRules = localRules.filter((r) => r.enabled).length;

  async function toggleRule(id: string, enabled: boolean) {
    setTogglingId(id);
    try {
      await fetch(`/api/tenants/${tenant.slug}/whatsapp/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      setLocalRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)),
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("¿Eliminar esta automatización?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/tenants/${tenant.slug}/whatsapp/automations/${id}`, {
        method: "DELETE",
      });
      setLocalRules((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-500" />
            WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {config
              ? `Bot activo: ${config.botName} · ${config.phoneNumberId}`
              : "Sin configuración WA"}
          </p>
        </div>
        {config && (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Conectado
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <div className="text-sm text-muted-foreground">
              Campañas totales
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-green-600">
              {completedCampaigns}
            </div>
            <div className="text-sm text-muted-foreground">Completadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-blue-600">
              {activeRules}
            </div>
            <div className="text-sm text-muted-foreground">
              Automatizaciones activas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="h-4 w-4" /> Campañas
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="h-4 w-4" /> Automatizaciones
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" /> Configuración del bot
          </TabsTrigger>
        </TabsList>

        {/* ─── Campañas ─────────────────────────────────────────────────── */}
        <TabsContent value="campaigns" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Mensajes masivos a tus clientes
            </p>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Nueva campaña
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay campañas aún. Crea la primera para enviar mensajes a tus
                clientes.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => {
                const s = STATUS_BADGE[c.status] ?? STATUS_BADGE.draft;
                return (
                  <Card key={c.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {c.scheduledAt
                            ? `Programada: ${new Date(c.scheduledAt).toLocaleString("es-MX")}`
                            : "Sin programar"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{c.sentCount} enviados</div>
                          <div>{c.readCount} leídos</div>
                        </div>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Automatizaciones ─────────────────────────────────────────── */}
        <TabsContent value="automations" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Mensajes automáticos cuando ocurre un evento
            </p>
            <Button
              size="sm"
              onClick={() => setAutomationOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Nueva regla
            </Button>
          </div>

          {localRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Sin automatizaciones. Crea una regla para enviar mensajes
                automáticos.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {localRules.map((r) => {
                const config = r.actionConfig as Record<string, unknown>;
                const delay = config?.delayMinutes as number | undefined;
                const delayLabel = delay
                  ? delay >= 1440
                    ? `${Math.round(delay / 1440)}d después`
                    : delay >= 60
                      ? `${Math.round(delay / 60)}h después`
                      : `${delay}min después`
                  : "Inmediato";

                return (
                  <Card key={r.id} className={r.enabled ? "" : "opacity-60"}>
                    <CardContent className="py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                          <span>
                            Trigger:{" "}
                            {TRIGGER_LABELS[r.triggerEvent] ?? r.triggerEvent}
                          </span>
                          <span>·</span>
                          <span>{delayLabel}</span>
                          <span>·</span>
                          <span>
                            {r.actionType === "send_text"
                              ? "Texto"
                              : r.actionType === "send_template"
                                ? "Plantilla"
                                : "Escalar"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={r.enabled ? "default" : "outline"}>
                          {r.enabled ? "Activa" : "Pausada"}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={r.enabled ? "Pausar" : "Activar"}
                          disabled={togglingId === r.id}
                          onClick={() => toggleRule(r.id, r.enabled)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Eliminar"
                          disabled={deletingId === r.id}
                          onClick={() => deleteRule(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Configuración ────────────────────────────────────────────── */}
        <TabsContent value="config" className="mt-4">
          {config ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Configuración del bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="text-muted-foreground">Nombre del bot</div>
                  <div className="font-medium">{config.botName}</div>
                  <div className="text-muted-foreground">Tono</div>
                  <div className="font-medium capitalize">{config.tone}</div>
                  <div className="text-muted-foreground">Phone Number ID</div>
                  <div className="font-mono text-xs">
                    {config.phoneNumberId}
                  </div>
                  <div className="text-muted-foreground">AI habilitada</div>
                  <div>{config.aiEnabled ? "Sí (Kimi K2.5)" : "No"}</div>
                  <div className="text-muted-foreground">Máx. tokens AI</div>
                  <div>{config.maxAiTokens}</div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-muted-foreground mb-1">
                    Mensaje de bienvenida
                  </div>
                  <div className="bg-muted rounded p-2 text-xs">
                    {config.greetingMsg}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">
                    Mensaje de escalación
                  </div>
                  <div className="bg-muted rounded p-2 text-xs">
                    {config.escalationMsg}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay configuración WA para este tenant. Contacta al
                administrador de plataforma.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CampaignCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tenantSlug={tenant.slug}
      />
      <AutomationCreateDialog
        open={automationOpen}
        onClose={() => {
          setAutomationOpen(false);
          router.refresh();
        }}
        tenantSlug={tenant.slug}
      />
    </div>
  );
}
