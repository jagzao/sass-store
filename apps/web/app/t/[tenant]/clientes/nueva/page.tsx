import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import CustomerForm from "@/components/customers/CustomerForm";
import { getClientTerms } from "@/lib/tenant/client-terminology";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function NewCustomerPage({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;
  const terms = getClientTerms(tenantSlug);

  return (
    <LiveRegionProvider>
      <div
        className="min-h-screen"
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a
                  href={`/t/${tenantSlug}`}
                  className="hover:underline inline-flex items-center"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  Inicio
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <span
                    className="mx-2"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    /
                  </span>
                  <a
                    href={`/t/${tenantSlug}/clientes`}
                    className="hover:underline"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    {terms.plural}
                  </a>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span
                    className="mx-2"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    /
                  </span>
                  <span style={{ color: "var(--color-foreground)" }}>
                    {terms.addLabel}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page Title */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--color-foreground)" }}
            >
              {terms.addLabel}
            </h1>
            <p style={{ color: "var(--color-muted-foreground)" }}>
              Complete la información básica del {terms.singularLower}
            </p>
          </div>

          {/* Customer Form */}
          <div className="max-w-3xl">
            <CustomerForm tenantSlug={tenantSlug} />
          </div>
        </main>
      </div>
    </LiveRegionProvider>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;
  const metaTerms = getClientTerms(tenantSlug);
  return { title: metaTerms.addLabel };
}
