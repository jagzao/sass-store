import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import QuoteDetails from "@/components/quotes/QuoteDetails";

interface QuoteDetailsPageProps {
  params: Promise<{
    tenant: string;
    id: string;
  }>;
}

export default async function QuoteDetailsPage({
  params,
}: QuoteDetailsPageProps) {
  const resolvedParams = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(
      `/api/auth/signin?callbackUrl=/t/${resolvedParams.tenant}/admin/quotes/${resolvedParams.id}`,
    );
  }

  // Permission check
  const isAuthorized =
    (session.user.role === "Admin" || session.user.role === "Gerente") &&
    session.user.tenantSlug === resolvedParams.tenant;

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-gray-600 mt-2">
          No tienes permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuoteDetails
        tenantSlug={resolvedParams.tenant}
        quoteId={resolvedParams.id}
      />
    </div>
  );
}
