"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ClientesPageWrapperProps {
  children: ReactNode;
  tenantSlug: string;
}

export default function ClientesPageWrapper({
  children,
  tenantSlug,
}: ClientesPageWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading session

    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
      return;
    }

    // Check if user has admin role
    const userRole = (session?.user as any)?.role;
    if (userRole !== "Admin") {
      router.push(`/t/${tenantSlug}`);
      return;
    }
  }, [session, status, router, tenantSlug]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">
            Verificando permisos de administrador...
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not admin
  const userRole = (session?.user as any)?.role;
  if (status === "unauthenticated" || userRole !== "Admin") {
    return null;
  }

  // If we get here, the user is authenticated and has admin role
  return <>{children}</>;
}
