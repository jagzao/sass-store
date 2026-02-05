"use client";

import { RetouchSystem } from "@/components/retouch/RetouchSystem";

interface RetouchPageProps {
  params: {
    tenant: string;
  };
}

export default function RetouchPage({ params }: RetouchPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <RetouchSystem />
    </div>
  );
}
