import { BudgetManager } from "@/components/finance/BudgetManager";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

export const metadata = {
  title: "Presupuestos - Gestion Financiera",
  description: "Administra tus presupuestos y limites de gasto",
};

interface BudgetsPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function BudgetsPage({ params }: BudgetsPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  return (
    <div className="container mx-auto px-4 py-8">
      <BudgetManager tenantId={tenantData.id} />
    </div>
  );
}
