"use client";

import React from "react";
import { InventoryManagement } from "@/components/inventory/InventoryManagement";

export default function ServiceInventoryPage({
  params,
}: {
  params: { serviceId: string; tenant: string };
}) {
  const serviceId = params.serviceId;

  return (
    <div className="container mx-auto px-4 py-8">
      <InventoryManagement
        serviceId={serviceId}
        initialTab="service-products"
      />
    </div>
  );
}
