import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "month";
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const platforms = searchParams.get("platforms")?.split(",") || [];
    const statuses = searchParams.get("statuses")?.split(",") || [];
    const formats = searchParams.get("formats")?.split(",") || [];

    // En un entorno real, aquí se consultaría la base de datos
    // Por ahora, devolveremos datos de demostración
    const demoData = {
      summary: [
        {
          date: "2024-01-15",
          post_count: 2,
          statuses: ["draft", "scheduled"],
          platforms: ["facebook", "instagram"],
          draft_count: 1,
          scheduled_count: 1,
          published_count: 0,
          failed_count: 0,
        },
        {
          date: "2024-01-16",
          post_count: 3,
          statuses: ["scheduled", "published"],
          platforms: ["facebook", "instagram", "tiktok"],
          draft_count: 0,
          scheduled_count: 1,
          published_count: 2,
          failed_count: 0,
        },
        {
          date: "2024-01-17",
          post_count: 1,
          statuses: ["published"],
          platforms: ["instagram"],
          draft_count: 0,
          scheduled_count: 0,
          published_count: 1,
          failed_count: 0,
        },
        {
          date: "2024-01-18",
          post_count: 2,
          statuses: ["draft", "failed"],
          platforms: ["facebook", "tiktok"],
          draft_count: 1,
          scheduled_count: 0,
          published_count: 0,
          failed_count: 1,
        },
        {
          date: "2024-01-19",
          post_count: 4,
          statuses: ["draft", "scheduled", "published"],
          platforms: ["facebook", "instagram", "tiktok", "linkedin"],
          draft_count: 1,
          scheduled_count: 2,
          published_count: 1,
          failed_count: 0,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: demoData,
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch calendar data" },
      { status: 500 },
    );
  }
}
