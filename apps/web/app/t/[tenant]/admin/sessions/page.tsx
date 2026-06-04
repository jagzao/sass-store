import { notFound } from "next/navigation";
import { isSportsTenant } from "@/lib/tenant/client-terminology";
import SessionsAdminClient from "./SessionsAdminClient";

export default async function AdminSessionsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  if (!isSportsTenant(tenant)) {
    notFound();
  }
  return <SessionsAdminClient tenantSlug={tenant} />;
}
