import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import ZoContactForm from "@/components/tenant/zo-system/ZoContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | Zo Systems",
  description:
    "Cuéntanos qué sistema necesitas construir, modernizar o rescatar. Agenda una llamada o envíanos un mensaje.",
  robots: {
    index: true,
    follow: true,
  },
};

interface ContactPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { tenant: tenantSlug } = await params;

  if (tenantSlug !== "zo-system") {
    notFound();
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  return <ZoContactForm />;
}
