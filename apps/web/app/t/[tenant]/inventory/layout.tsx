import { requireAdmin } from "@/lib/require-admin";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function InventoryLayout({ children, params }: Props) {
  const { tenant } = await params;
  await requireAdmin(tenant);
  return <>{children}</>;
}
