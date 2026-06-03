"use client";

import { useEffect, useState } from "react";
import { QualityDashboardClient } from "./QualityDashboardClient";

export default function QualityPage() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/system/quality")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load quality data");
        const json = await res.json();
        setData(json.data ?? json);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 min-h-screen bg-[#0D0D0D] text-white font-[family-name:var(--font-montserrat)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Panel de Calidad — Quality OS
        </h1>
        <p className="text-gray-400">
          Métricas de calidad del proyecto extraídas de .agent-reports
        </p>
      </div>
      {loading ? (
        <div className="text-gray-400">Cargando datos de calidad…</div>
      ) : (
        <QualityDashboardClient data={data} />
      )}
    </div>
  );
}
