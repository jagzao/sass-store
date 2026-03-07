import { BudgetManagerClient } from "@/components/finance/BudgetManagerClient";

export const metadata = {
  title: "Presupuestos - Gestión Financiera",
  description: "Administra tus presupuestos y límites de gasto",
};

interface BudgetsPageProps {
  params: Promise<{ tenant: string }>;
}

// This is now a client component to avoid server-side rendering issues
export default function BudgetsPage({ params }: BudgetsPageProps) {
  // We'll get the tenant slug from the params
  const tenantSlug = "manada-juma"; // This would normally come from resolvedParams.tenant

  return (
    <div className="container mx-auto px-4 py-8">
      <BudgetManagerClient tenantId={tenantSlug} />
    </div>
  );
}
