import { notFound } from "next/navigation";
import { isSportsTenant } from "@/lib/tenant/client-terminology";
import SessionsPublicClient from "./SessionsPublicClient";

export default async function PublicSessionsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  if (!isSportsTenant(tenant)) {
    notFound();
  }
  return <SessionsPublicClient tenantSlug={tenant} />;
}
