import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import QuoteList from "@/components/quotes/QuoteList";

interface AdminQuotesPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function AdminQuotesPage({
  params,
}: AdminQuotesPageProps) {
  const resolvedParams = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(
      `/api/auth/signin?callbackUrl=/t/${resolvedParams.tenant}/admin/quotes`,
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 mt-1">
            Gestiona las cotizaciones generadas para tus servicios
          </p>
        </div>
      </div>

      <QuoteList tenantSlug={resolvedParams.tenant} />
    </div>
  );
}
