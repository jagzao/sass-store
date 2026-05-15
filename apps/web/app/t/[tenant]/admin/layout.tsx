import { requireAdmin } from "@/lib/require-admin";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { tenant } = await params;
  await requireAdmin(tenant);
  return <>{children}</>;
}
