import { SupplyExpenseReport } from "@/components/inventory/SupplyExpenseReport";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

export const metadata = {
  title: "Gastos de Insumos - Inventario",
  description: "Reporte de gastos generados por compras de insumos",
};

interface SuppliesPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function SuppliesPage({ params }: SuppliesPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  return (
    <div className="container mx-auto px-4 py-8">
      <SupplyExpenseReport tenantId={tenantData.id} />
    </div>
  );
}
