export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed";

export type CampaignAudienceType = "all" | "segment" | "manual";

export interface Campaign {
  id: string;
  tenantSlug: string;
  name: string;
  status: CampaignStatus;
  messageTemplateId: string;
  templateVars: Record<string, string>;
  audienceType: CampaignAudienceType;
  audienceFilter?: CampaignAudienceFilter;
  scheduledAt?: Date;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  replyCount: number;
  createdAt: Date;
}

export interface CampaignAudienceFilter {
  tags?: string[];
  lastVisitDays?: number; // clientes con visita en los últimos N días
  noVisitDays?: number; // clientes inactivos por N días
  serviceIds?: string[]; // clientes que se hacen X servicio
  phones?: string[]; // lista manual de teléfonos
}

export interface AutomationRule {
  id: string;
  tenantSlug: string;
  name: string;
  enabled: boolean;
  triggerEvent:
    | "booking_confirmed"
    | "booking_cancelled"
    | "customer_inactive_30d"
    | "after_visit"
    | "birthday";
  conditions?: Record<string, unknown>;
  actionType: "send_template" | "send_text" | "escalate";
  actionConfig: AutomationActionConfig;
}

export interface AutomationActionConfig {
  templateId?: string;
  templateVars?: Record<string, string>;
  message?: string;
  delayMinutes?: number;
}
