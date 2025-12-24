import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const platforms = searchParams.get("platforms")?.split(",") || [];

    // En un entorno real, aquí se consultaría la base de datos para obtener métricas reales
    // Por ahora, devolveremos datos de demostración
    const demoData = {
      totalReach: 15420,
      totalInteractions: 892,
      newFollowers: 156,
      engagementRate: 5.8,
      platformBreakdown: [
        { platform: "facebook", reach: 8200, interactions: 420, followers: 89 },
        {
          platform: "instagram",
          reach: 6400,
          interactions: 380,
          followers: 67,
        },
        { platform: "tiktok", reach: 3200, interactions: 92, followers: 0 },
      ],
      topPosts: [
        {
          id: "post-1",
          title: "Transformación increíble",
          content:
            "Mira el cambio espectacular de nuestra clienta. ¡Resultados profesionales!",
          platform: "instagram",
          reach: 2400,
          interactions: 156,
          engagementRate: 6.5,
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "post-2",
          title: "Promoción especial",
          content:
            "✨ Oferta especial en nuestros servicios de uñas. ¡No te la pierdas!",
          platform: "facebook",
          reach: 1800,
          interactions: 98,
          engagementRate: 5.4,
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: "post-3",
          title: "Tip del día",
          content:
            "💡 ¿Sabías que...? Consejos profesionales para el cuidado de tus uñas.",
          platform: "tiktok",
          reach: 3200,
          interactions: 280,
          engagementRate: 8.8,
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ],
      timeSeriesData: [] as Array<{
        date: string;
        reach: number;
        interactions: number;
      }>,
    };

    // Generar datos de series temporales para el gráfico
    const days = 30; // Por defecto, mostrar los últimos 30 días
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      demoData.timeSeriesData.push({
        date: date.toISOString().split("T")[0], // Formato YYYY-MM-DD
        reach: Math.floor(Math.random() * 500) + 200,
        interactions: Math.floor(Math.random() * 50) + 10,
      });
    }

    // Filtrar por plataformas si se especifican
    if (platforms.length > 0) {
      demoData.platformBreakdown = demoData.platformBreakdown.filter((p) =>
        platforms.includes(p.platform),
      );

      // Recalcular totales basados en las plataformas filtradas
      demoData.totalReach = demoData.platformBreakdown.reduce(
        (sum, p) => sum + p.reach,
        0,
      );
      demoData.totalInteractions = demoData.platformBreakdown.reduce(
        (sum, p) => sum + p.interactions,
        0,
      );
      demoData.newFollowers = demoData.platformBreakdown.reduce(
        (sum, p) => sum + p.followers,
        0,
      );
    }

    return NextResponse.json({
      success: true,
      data: demoData,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }
}
