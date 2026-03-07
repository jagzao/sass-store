import { CategoryManager } from "@/components/finance/CategoryManager";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

export const metadata = {
  title: "Categorías - Gestión Financiera",
  description: "Administra las categorías de ingresos y gastos",
};

interface CategoriesPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryManager tenantId={tenantData.id} />
    </div>
  );
}
