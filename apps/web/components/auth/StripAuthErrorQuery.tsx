"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Removes `?error=` from the URL after a short delay so stale OAuth errors
 * do not persist across refreshes and server logs stay readable.
 */
export function StripAuthErrorQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!searchParams.get("error")) {
      return;
    }
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("error");
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 8000);
    return () => window.clearTimeout(t);
  }, [searchParams, pathname, router]);

  return null;
}
