"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Send,
  History,
  Settings,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { TenantNotificationTemplates } from "@/lib/notifications/notification-template";
import { useAdminTheme } from "@/components/admin/admin-theme-context";
import { adminCardStyle } from "@/lib/tenant/admin-theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  tenantSlug: string;
  tenantName: string;
  initialTemplates: TenantNotificationTemplates;
  initialStaffPhone: string | null;
  totalCustomersWithPhone: number;
};

type NotifRow = {
  id: string;
  channel: string;
  status: string;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  templateKey: string | null;
  scheduledAt: string;
  sentAt: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type HistoryStats = {
  sent: number;
  failed: number;
  pending: number;
  processing: number;
  cancelled: number;
  sentToday: number;
};

type RecipientType = "all" | "upcoming" | "inactive" | "specific";

// ─── Template definitions ──────────────────────────────────────────────────────

const CLIENT_TEMPLATES: {
  key: keyof TenantNotificationTemplates;
  label: string;
  desc: string;
  when: string;
}[] = [
  {
    key: "confirmation",
    label: "Confirmación de cita",
    desc: "Al crear una nueva cita",
    when: "Inmediato",
  },
  {
    key: "reminder24h",
    label: "Recordatorio 24 horas",
    desc: "Un día antes de la cita",
    when: "24h antes",
  },
  {
    key: "reminder1h",
    label: "Recordatorio 1 hora",
    desc: "Una hora antes de la cita",
    when: "1h antes",
  },
  {
    key: "confirmed",
    label: "Cita confirmada",
    desc: "Cuando el admin confirma una cita pendiente",
    when: "Inmediato",
  },
  {
    key: "cancelled",
    label: "Cita cancelada",
    desc: "Cuando se cancela una cita",
    when: "Inmediato",
  },
  {
    key: "noshow",
    label: "No asistió",
    desc: "Si el cliente no se presentó",
    when: "+30min",
  },
  {
    key: "reviewRequest",
    label: "Solicitar reseña",
    desc: "Después de completar la cita",
    when: "+2h",
  },
];

const STAFF_TEMPLATES: {
  key: keyof TenantNotificationTemplates;
  label: string;
  desc: string;
  when: string;
}[] = [
  {
    key: "staffNewBooking",
    label: "Nueva cita (staff)",
    desc: "Avisa al negocio cuando llega una reserva",
    when: "Inmediato",
  },
  {
    key: "staffReminderEvening",
    label: "Recordatorio noche anterior (staff)",
    desc: "Prepara lo necesario para mañana",
    when: "Noche anterior",
  },
  {
    key: "staffReminder2h",
    label: "Recordatorio 2 horas (staff)",
    desc: "Alerta final antes de la cita",
    when: "2h antes",
  },
];

const PLACEHOLDERS = [
  "{{customerName}}",
  "{{tenantName}}",
  "{{serviceName}}",
  "{{appointmentDateTime}}",
  "{{customerPhone}}",
];

// ─── Template editor sub-component ────────────────────────────────────────────

function TemplateEditor({
  label,
  desc,
  when,
  fieldKey,
  value,
  onChange,
  saving,
  primaryColor,
}: {
  label: string;
  desc: string;
  when: string;
  fieldKey: keyof TenantNotificationTemplates;
  value: string;
  onChange: (key: keyof TenantNotificationTemplates, val: string) => void;
  saving: boolean;
  primaryColor: string;
}) {
  const insertPlaceholder = (p: string) => {
    onChange(fieldKey, value + p);
  };
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white hover:bg-gray-50 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {when}
        </Badge>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        rows={3}
        className="text-sm resize-none"
        placeholder={`Mensaje para "${label}"...`}
        disabled={saving}
      />
      <div className="flex flex-wrap gap-1">
        {PLACEHOLDERS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => insertPlaceholder(p)}
            className="text-xs px-2 py-0.5 rounded border transition-colors"
            style={{
              color: primaryColor,
              borderColor: `${primaryColor}40`,
              backgroundColor: `${primaryColor}14`,
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    sent: {
      label: "Enviado",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle2 size={11} />,
    },
    failed: {
      label: "Fallido",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle size={11} />,
    },
    pending: {
      label: "Pendiente",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: <Clock size={11} />,
    },
    processing: {
      label: "Procesando",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 size={11} className="animate-spin" />,
    },
    cancelled: {
      label: "Cancelado",
      className: "bg-gray-50 text-gray-500 border-gray-200",
      icon: <XCircle size={11} />,
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: "bg-gray-50 text-gray-500 border-gray-200",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function NotificationsClient({
  tenantSlug,
  tenantName,
  initialTemplates,
  initialStaffPhone,
  totalCustomersWithPhone,
}: Props) {
  const theme = useAdminTheme();
  const cardCls =
    "bg-white border border-gray-200 shadow-sm rounded-lg text-gray-800";
  const sectionTitle = `${theme.serifHeading ? "font-serif" : ""} text-base font-semibold`;
  const cardSurface = adminCardStyle(theme);
  // ── Templates state ──────────────────────────────────────────────────────
  const [templates, setTemplates] =
    useState<TenantNotificationTemplates>(initialTemplates);
  const [staffPhone, setStaffPhone] = useState(initialStaffPhone ?? "");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const handleTemplateChange = (
    key: keyof TenantNotificationTemplates,
    val: string,
  ) => setTemplates((prev) => ({ ...prev, [key]: val }));

  const saveTemplates = async () => {
    setTemplateSaving(true);
    setTemplateMsg(null);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/notifications/templates`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...templates,
            staffPhone: staffPhone || null,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      setTemplates(json.data);
      setTemplateMsg({ ok: true, text: "Plantillas guardadas correctamente" });
    } catch (e: unknown) {
      setTemplateMsg({
        ok: false,
        text: e instanceof Error ? e.message : "Error desconocido",
      });
    } finally {
      setTemplateSaving(false);
    }
  };

  // ── Broadcast state ──────────────────────────────────────────────────────
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [daysAhead, setDaysAhead] = useState(7);
  const [daysSince, setDaysSince] = useState(60);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduleDate, setScheduleDate] = useState("");
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const fetchEstimate = useCallback(async () => {
    let url = `/api/tenants/${tenantSlug}/notifications/broadcast?type=${recipientType}`;
    if (recipientType === "upcoming") url += `&daysAhead=${daysAhead}`;
    if (recipientType === "inactive") url += `&daysSince=${daysSince}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      setEstimatedCount(json.data?.estimatedCount ?? null);
    } catch {
      setEstimatedCount(null);
    }
  }, [tenantSlug, recipientType, daysAhead, daysSince]);

  useEffect(() => {
    if (recipientType !== "specific") fetchEstimate();
  }, [fetchEstimate, recipientType]);

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const body: Record<string, unknown> = {
        message: broadcastMsg.trim(),
        scheduledAt: scheduleNow ? undefined : scheduleDate || undefined,
      };
      if (recipientType === "all") body.recipients = { type: "all" };
      if (recipientType === "upcoming")
        body.recipients = { type: "upcoming", daysAhead };
      if (recipientType === "inactive")
        body.recipients = { type: "inactive", daysSince };

      const res = await fetch(
        `/api/tenants/${tenantSlug}/notifications/broadcast`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al enviar");
      setBroadcastResult({
        ok: true,
        text: `✓ ${json.data.queued} mensajes encolados. Llegarán en los próximos 5 minutos.`,
      });
      setBroadcastMsg("");
    } catch (e: unknown) {
      setBroadcastResult({
        ok: false,
        text: e instanceof Error ? e.message : "Error desconocido",
      });
    } finally {
      setBroadcastSending(false);
    }
  };

  // ── History state ────────────────────────────────────────────────────────
  const [history, setHistory] = useState<NotifRow[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [historyFilter, setHistoryFilter] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(
    async (status?: string) => {
      setHistoryLoading(true);
      try {
        const url = `/api/tenants/${tenantSlug}/notifications/history?limit=50${status ? `&status=${status}` : ""}`;
        const res = await fetch(url);
        const json = await res.json();
        setHistory(json.data ?? []);
        setHistoryStats(json.stats ?? null);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [tenantSlug],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        {/* Tab nav */}
        <div className="sticky top-4 z-10 backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-sm p-2 mb-6">
          <TabsList className="flex w-full bg-transparent h-auto gap-2 p-0">
            {[
              {
                value: "templates",
                label: "Recordatorios automáticos",
                icon: <Settings size={15} />,
              },
              {
                value: "broadcast",
                label: "Mensajes masivos",
                icon: <Send size={15} />,
              },
              {
                value: "history",
                label: "Historial",
                icon: <History size={15} />,
              },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                onClick={() => tab.value === "history" && loadHistory()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:shadow-md data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── TAB 1: Templates ─────────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-0 outline-none space-y-6">
          {/* Staff phone */}
          <Card className={cardCls} style={cardSurface}>
            <CardHeader className="pb-3">
              <CardTitle
                className={`${sectionTitle} flex items-center gap-2`}
                style={{ color: theme.headingColor }}
              >
                <Users size={16} style={{ color: theme.primary }} />
                Número de WhatsApp del negocio (staff)
              </CardTitle>
              <CardDescription className="text-gray-500">
                Las notificaciones de nueva cita y recordatorios llegarán a este
                número. Dejarlo vacío desactiva los avisos al staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-center max-w-sm">
                <span className="text-sm shrink-0 text-gray-500">🇲🇽 +52</span>
                <Input
                  placeholder="551234567890"
                  value={staffPhone}
                  onChange={(e) =>
                    setStaffPhone(e.target.value.replace(/\D/g, ""))
                  }
                  className="font-mono bg-white"
                  maxLength={15}
                />
              </div>
            </CardContent>
          </Card>

          {/* Client templates */}
          <Card className={cardCls} style={cardSurface}>
            <CardHeader className="pb-3">
              <CardTitle
                className={`${sectionTitle} flex items-center gap-2`}
                style={{ color: theme.headingColor }}
              >
                <Bell size={16} style={{ color: theme.primary }} />
                Mensajes al cliente
              </CardTitle>
              <CardDescription className="text-gray-500">
                Personaliza cada mensaje usando los marcadores de posición.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CLIENT_TEMPLATES.map((t) => (
                <TemplateEditor
                  key={t.key}
                  label={t.label}
                  desc={t.desc}
                  when={t.when}
                  fieldKey={t.key}
                  value={templates[t.key] as string}
                  onChange={handleTemplateChange}
                  saving={templateSaving}
                  primaryColor={theme.primary}
                />
              ))}
            </CardContent>
          </Card>

          {/* Staff templates */}
          <Card className={cardCls} style={cardSurface}>
            <CardHeader className="pb-3">
              <CardTitle
                className={`${sectionTitle} flex items-center gap-2`}
                style={{ color: theme.headingColor }}
              >
                <Settings size={16} style={{ color: theme.primary }} />
                Mensajes al negocio (staff)
              </CardTitle>
              <CardDescription>
                Avisos internos para que el equipo esté preparado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {STAFF_TEMPLATES.map((t) => (
                <TemplateEditor
                  key={t.key}
                  label={t.label}
                  desc={t.desc}
                  when={t.when}
                  fieldKey={t.key}
                  value={templates[t.key] as string}
                  onChange={handleTemplateChange}
                  saving={templateSaving}
                  primaryColor={theme.primary}
                />
              ))}
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-4">
            <Button
              onClick={saveTemplates}
              disabled={templateSaving}
              className="px-6 text-white hover:opacity-90"
              style={{ backgroundColor: theme.primary }}
            >
              {templateSaving ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Guardar plantillas
            </Button>
            {templateMsg && (
              <p
                className={`text-sm ${templateMsg.ok ? "text-green-600" : "text-red-600"}`}
              >
                {templateMsg.text}
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: Broadcast ─────────────────────────────────────────────── */}
        <TabsContent value="broadcast" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: config */}
            <div className="space-y-5">
              {/* Recipients */}
              <Card className={cardCls} style={cardSurface}>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`${sectionTitle} flex items-center gap-2`}
                    style={{ color: theme.headingColor }}
                  >
                    <Users size={16} style={{ color: theme.primary }} />
                    Destinatarios
                  </CardTitle>
                  <CardDescription>
                    {totalCustomersWithPhone} clientes con número de teléfono
                    registrado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      value: "all" as RecipientType,
                      label: "Todos los clientes",
                      desc: "Enviar a todos los que tienen teléfono",
                    },
                    {
                      value: "upcoming" as RecipientType,
                      label: "Con cita próxima",
                      desc: "Solo clientes con cita en los próximos días",
                    },
                    {
                      value: "inactive" as RecipientType,
                      label: "Sin visitar desde...",
                      desc: "Re-engagement para clientes que no han vuelto",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        recipientType === opt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipients"
                        value={opt.value}
                        checked={recipientType === opt.value}
                        onChange={() => setRecipientType(opt.value)}
                        className="mt-0.5 accent-[var(--color-primary)]"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}

                  {recipientType === "upcoming" && (
                    <div className="ml-7 flex items-center gap-3">
                      <Label className="text-xs text-gray-600 shrink-0">
                        Próximos
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={daysAhead}
                        onChange={(e) => setDaysAhead(Number(e.target.value))}
                        className="w-20 text-center"
                      />
                      <Label className="text-xs text-gray-600 shrink-0">
                        días
                      </Label>
                    </div>
                  )}
                  {recipientType === "inactive" && (
                    <div className="ml-7 flex items-center gap-3">
                      <Label className="text-xs text-gray-600 shrink-0">
                        Sin visitar desde hace
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={daysSince}
                        onChange={(e) => setDaysSince(Number(e.target.value))}
                        className="w-20 text-center"
                      />
                      <Label className="text-xs text-gray-600 shrink-0">
                        días
                      </Label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card className={cardCls} style={cardSurface}>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`${sectionTitle} flex items-center gap-2`}
                    style={{ color: theme.headingColor }}
                  >
                    <Clock size={16} style={{ color: theme.primary }} />
                    Programación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={scheduleNow}
                        onChange={() => setScheduleNow(true)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm">Enviar ahora</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!scheduleNow}
                        onChange={() => setScheduleNow(false)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm">Programar</span>
                    </label>
                  </div>
                  {!scheduleNow && (
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: message + preview */}
            <div className="space-y-5">
              <Card className={cardCls} style={cardSurface}>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`${sectionTitle} flex items-center gap-2`}
                    style={{ color: theme.headingColor }}
                  >
                    <Send size={16} style={{ color: theme.primary }} />
                    Mensaje
                  </CardTitle>
                  <CardDescription>
                    Máximo 4,000 caracteres. Sin variables automáticas en
                    broadcasts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder={`Hola, somos ${tenantName}. Te escribimos para...`}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    rows={7}
                    className="resize-none"
                    maxLength={4000}
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {broadcastMsg.length}/4000
                  </p>
                </CardContent>
              </Card>

              {/* Preview + send */}
              <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Resumen</p>
                    {recipientType !== "specific" && (
                      <button
                        onClick={fetchEstimate}
                        className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={11} /> Actualizar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-[var(--color-primary)]">
                        {estimatedCount ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        destinatarios estimados
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-700">
                        {scheduleNow
                          ? "Ahora"
                          : scheduleDate
                            ? scheduleDate.slice(11, 16)
                            : "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {scheduleNow
                          ? "envío inmediato"
                          : scheduleDate.slice(0, 10) || "sin fecha"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={sendBroadcast}
                    disabled={
                      broadcastSending ||
                      !broadcastMsg.trim() ||
                      estimatedCount === 0
                    }
                    className="w-full bg-[var(--color-primary)] hover:opacity-90 text-white"
                  >
                    {broadcastSending ? (
                      <>
                        <Loader2 size={15} className="animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={15} className="mr-2" />
                        Enviar campaña
                      </>
                    )}
                  </Button>
                  {broadcastResult && (
                    <p
                      className={`text-sm text-center ${broadcastResult.ok ? "text-green-600" : "text-red-600"}`}
                    >
                      {broadcastResult.text}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 3: History ────────────────────────────────────────────────── */}
        <TabsContent value="history" className="mt-0 outline-none space-y-5">
          {/* Stats */}
          {historyStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Enviados hoy",
                  value: historyStats.sentToday,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "Enviados (7d)",
                  value: historyStats.sent,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Pendientes",
                  value: historyStats.pending + historyStats.processing,
                  color: "text-yellow-600",
                  bg: "bg-yellow-50",
                },
                {
                  label: "Fallidos",
                  value: historyStats.failed,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
              ].map((s) => (
                <Card key={s.label} className={`${s.bg} border-0`}>
                  <CardContent className="pt-4 pb-3">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters + reload */}
          <div className="flex gap-2 flex-wrap">
            {["", "pending", "sent", "failed", "cancelled"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setHistoryFilter(f);
                  loadHistory(f || undefined);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  historyFilter === f
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[var(--color-primary)]/50"
                }`}
              >
                {f === "" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button
              onClick={() => loadHistory(historyFilter || undefined)}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-gray-600 border-gray-200 hover:border-gray-300 flex items-center gap-1"
            >
              <RefreshCw
                size={11}
                className={historyLoading ? "animate-spin" : ""}
              />
              Actualizar
            </button>
          </div>

          {/* Table */}
          <Card className={cardCls} style={cardSurface}>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <AlertCircle size={24} className="mb-2" />
                  <p className="text-sm">
                    Sin notificaciones. Haz clic en "Actualizar".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Destinatario</th>
                        <th className="text-left px-4 py-3">Tipo</th>
                        <th className="text-left px-4 py-3">Estado</th>
                        <th className="text-left px-4 py-3">Programado</th>
                        <th className="text-left px-4 py-3">Canal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">
                              {row.recipientName ?? "—"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {row.recipientPhone ?? row.recipientEmail ?? ""}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {row.templateKey ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                            {row.lastError && (
                              <p
                                className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate"
                                title={row.lastError}
                              >
                                {row.lastError}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(row.scheduledAt).toLocaleString("es-MX", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs">
                              {row.channel === "whatsapp"
                                ? "📱 WA"
                                : "✉️ Email"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
