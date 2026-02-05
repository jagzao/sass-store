import { type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <AdminSidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
