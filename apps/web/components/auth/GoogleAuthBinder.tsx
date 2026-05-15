"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Props {
  tenantSlug: string;
}

// Silently binds a Google OAuth session to the current tenant.
// Fires once when the user is authenticated but has no tenantSlug in their token
// (which happens right after Google login before the first tenant assignment).
export function GoogleAuthBinder({ tenantSlug }: Props) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !session?.user ||
      (session.user as any).tenantSlug ||
      attempted.current
    ) {
      return;
    }

    attempted.current = true;

    fetch("/api/auth/bind-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug }),
    })
      .then((r) => r.json())
      .then(({ role, isNewUser }) => {
        update({ tenantSlug, role: role ?? "Cliente" });
        if (isNewUser) {
          router.push(`/t/${tenantSlug}/profile?welcome=1`);
        }
      })
      .catch(() => update({ tenantSlug, role: "Cliente" }));
  }, [status, session, tenantSlug, update, router]);

  return null;
}
