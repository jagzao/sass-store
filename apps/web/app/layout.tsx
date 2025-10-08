import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/components/providers/jotai-provider";
import { ToastProvider } from "@/components/ui/toast-provider";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <JotaiProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background">{children}</div>
          </ToastProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
