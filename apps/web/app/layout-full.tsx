import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { TenantProvider } from "@/lib/tenant/tenant-provider";
import { QuickActionsDock } from "@/components/quick-actions-dock";
import { CommandPalette } from "@/components/command-palette";
import { Toaster } from "@/components/ui/toaster";
import { resolveTenant } from "@/lib/tenant/resolver";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sass Store",
  description: "Multitenant SaaS platform for beauty salons",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Server-side tenant resolution
  const tenant = await resolveTenant();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <TenantProvider tenant={tenant}>
            <div className="min-h-screen bg-background">
              {children}
              <QuickActionsDock />
              <CommandPalette />
            </div>
            <Toaster />
          </TenantProvider>
        </Providers>
      </body>
    </html>
  );
}
