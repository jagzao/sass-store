"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface LoginRedirectProps {
  tenantSlug: string;
}

export function LoginRedirect({ tenantSlug }: LoginRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run redirect logic if session status is determined
    if (status === "loading") return;

    // If the user is already authenticated and not on the login page, no action needed
    if (status === "authenticated" && session) {
      // If they're on the root tenant page, they can stay
      if (pathname === `/t/${tenantSlug}`) {
        return;
      }

      // If they're on the login page, redirect to the tenant page
      if (pathname.includes("/login")) {
        router.push(`/t/${tenantSlug}`);
        return;
      }
    }

    // If the user is not authenticated and not on the login page, redirect to login
    if (status === "unauthenticated" && !pathname.includes("/login")) {
      router.push(`/t/${tenantSlug}/login`);
      return;
    }
  }, [session, status, router, pathname, tenantSlug]);

  // Return null while redirecting
  return null;
}
