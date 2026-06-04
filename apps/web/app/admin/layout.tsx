import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Only Admin role can access the global /admin area
  const role = (session.user as any).role as string | undefined;
  if (role !== "Admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <AdminSidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
