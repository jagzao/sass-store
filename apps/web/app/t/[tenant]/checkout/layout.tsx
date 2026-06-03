import type { ReactNode } from "react";

/** Payment flows must not be SSG'd for every tenant at build time. */
export const dynamic = "force-dynamic";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
