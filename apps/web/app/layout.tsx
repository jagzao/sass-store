import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/components/providers/jotai-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { CartSyncProvider } from "@/components/cart/CartSyncProvider";
import { registerServiceWorker } from "@/lib/sw-register";
import { initWebVitals } from "@/lib/web-vitals";
import { startMemoryLeakDetection } from "@/lib/memory-management";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "Sass Store",
  description: "Multitenant SaaS platform for beauty salons",
};

// Force dynamic rendering to avoid useContext issues during build
export const dynamic = "force-dynamic";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Registrar Service Worker, Web Vitals y memory leak detection en el cliente
  if (typeof window !== 'undefined') {
    registerServiceWorker();
    initWebVitals();
    startMemoryLeakDetection();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthSessionProvider>
          <JotaiProvider>
            <ToastProvider>
              <CartSyncProvider>
                <div className="min-h-screen bg-background">{children}</div>
              </CartSyncProvider>
            </ToastProvider>
          </JotaiProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
