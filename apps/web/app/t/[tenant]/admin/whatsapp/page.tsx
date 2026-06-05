import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@sass-store/database";
import {
  tenants,
  waCampaigns,
  waAutomationRules,
  waTenantConfig,
} from "@sass-store/database/schema";
import { eq, desc } from "drizzle-orm";
import { WhatsAppDashboard } from "./whatsapp-dashboard";

async function getTenantData(slug: string) {
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!tenant) return null;

  const [config] = await db
    .select()
    .from(waTenantConfig)
    .where(eq(waTenantConfig.tenantSlug, slug))
    .limit(1);

  const campaigns = await db
    .select()
    .from(waCampaigns)
    .where(eq(waCampaigns.tenantSlug, slug))
    .orderBy(desc(waCampaigns.createdAt))
    .limit(20);

  const rules = await db
    .select()
    .from(waAutomationRules)
    .where(eq(waAutomationRules.tenantSlug, slug))
    .orderBy(desc(waAutomationRules.createdAt));

  return { tenant, config: config ?? null, campaigns, rules };
}

export default async function WhatsAppAdminPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const data = await getTenantData(slug);
  if (!data) notFound();

  return (
    <Suspense
      fallback={<div className="p-6 text-muted-foreground">Cargando...</div>}
    >
      <WhatsAppDashboard {...data} />
    </Suspense>
  );
}
