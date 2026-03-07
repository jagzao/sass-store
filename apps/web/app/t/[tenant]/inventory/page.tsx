import { InventorySystem } from "@/components/inventory/InventorySystem";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";

export default async function InventoryPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  return (
    <AdminLayoutProvider tenantSlug={tenant}>
      <InventorySystem />
    </AdminLayoutProvider>
  );
}
