"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginRedirect } from "@/components/auth/LoginRedirect";

interface PageClientProps {
  tenantSlug: string;
  children: React.ReactNode;
}

export default function PageClient({ tenantSlug, children }: PageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Use the LoginRedirect component to handle authentication redirects
  return (
    <>
      <LoginRedirect tenantSlug={tenantSlug} />
      {children}
    </>
  );
}
