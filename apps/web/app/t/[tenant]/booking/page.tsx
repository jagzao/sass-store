import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
  searchParams: Promise<{
    time?: string;
    service?: string;
  }>;
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { tenant } = resolvedParams;

  // If a specific service is provided, redirect to that service's booking page
  if (resolvedSearchParams.service) {
    redirect(`/t/${tenant}/booking/${resolvedSearchParams.service}`);
  }

  // Otherwise, redirect to services page where users can browse services
  redirect(`/t/${tenant}/services`);
}
