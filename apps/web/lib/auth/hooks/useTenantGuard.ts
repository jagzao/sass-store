"use client";

import { useSession, signOut } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function useTenantGuard() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = params.tenant as string;
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag when component mounts or tenant changes
    hasRedirectedRef.current = false;
  }, [tenantSlug]);

  useEffect(() => {
    if (status === "loading") {
      return; // Wait for session to load
    }

    // Don't redirect if already on login page or if we've already redirected
    const isOnLoginPage = pathname?.includes("/login");
    if (isOnLoginPage || hasRedirectedRef.current) {
      return;
    }

    if (status === "unauthenticated") {
      // No session, but trying to access a tenant page, redirect to login
      if (tenantSlug) {
        hasRedirectedRef.current = true;
        router.replace(`/t/${tenantSlug}/login`);
      }
      return;
    }

    if (
      session?.user &&
      (session.user as any)?.tenantSlug &&
      tenantSlug &&
      (session.user as any).tenantSlug !== tenantSlug
    ) {
      // Session is for a different tenant, sign out and redirect to new tenant's login
      hasRedirectedRef.current = true;
      signOut({ redirect: false }).then(() => {
        router.replace(`/t/${tenantSlug}/login`);
      });
    }
  }, [session, status, tenantSlug, router]); // Removed pathname from dependencies
}
