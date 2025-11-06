import { Inter } from "next/font/google";
import "./globals.css";
// JotaiProvider removed - migrated to Zustand
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { CartSyncProvider } from "@/components/cart/CartSyncProvider";
import { ClientInit } from "@/components/client-init";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "Sass Store",
  description: "Multitenant SaaS platform for beauty salons",
};

// Removed force-dynamic to allow static optimization where possible
// Individual routes can still use dynamic = "force-dynamic" if needed

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Note: Service Worker, Web Vitals, and memory leak detection
  // are initialized in ClientInit component (client-side)
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientInit />
        <AuthSessionProvider>
          <ToastProvider>
            <CartSyncProvider>
              <div className="min-h-screen bg-background">{children}</div>
            </CartSyncProvider>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
