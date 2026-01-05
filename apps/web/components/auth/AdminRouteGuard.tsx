"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

interface AdminRouteGuardProps {
  children: ReactNode;
  tenantSlug: string;
}

export default function AdminRouteGuard({
  children,
  tenantSlug,
}: AdminRouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Use a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsChecking(false);
    }, 3000); // 3 seconds timeout

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

    // Clear timeout if everything is OK
    clearTimeout(timeoutId);
    setIsChecking(false);

    return () => clearTimeout(timeoutId);
  }, [session, status, router, tenantSlug]);

  // Show loading state while checking session
  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
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
