export const metadata = {
  title: "SaaS Store API",
  description: "Multi-tenant SaaS API for beauty salons",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
