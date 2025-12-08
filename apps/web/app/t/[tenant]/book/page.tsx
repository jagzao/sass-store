import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function BookPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { tenant } = resolvedParams;

  // Redirect to services page where users can browse and book services
  redirect(`/t/${tenant}/services`);
}
