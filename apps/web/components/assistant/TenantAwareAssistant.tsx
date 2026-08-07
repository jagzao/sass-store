"use client";

import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { WonderAssistantWidget } from "./WonderAssistantWidget";

const WONDER_TENANT_SLUG = "wondernails";

export function TenantAwareAssistant() {
  const tenantSlug = useTenantSlug();

  if (tenantSlug === WONDER_TENANT_SLUG) {
    return <WonderAssistantWidget />;
  }

  return <FeedbackWidget />;
}
