import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status") || "";
    const platform = searchParams.get("platform") || "";

    // En un entorno real, aquí se consultaría la base de datos
    // Por ahora, devolveremos datos de demostración
    const demoPosts = [
      {
        id: "queue-post-1",
        title: "Promoción de fin de semana",
        content:
          "✨ Oferta especial en nuestros servicios de uñas este fin de semana. ¡No te la pierdas!",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días desde ahora
        platforms: ["facebook", "instagram"],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
      },
      {
        id: "queue-post-2",
        title: "Transformación increíble",
        content:
          "Mira el cambio espectacular de nuestra clienta. ¡De simple a espectacular en una sola sesión!",
        status: "draft",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días desde ahora
        platforms: ["instagram", "tiktok"],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      },
      {
        id: "queue-post-3",
        title: "Tip del día",
        content:
          "💡 ¿Sabías que...? El uso de base coat antes del esmalte protege tus uñas y ayuda a que el color dure más tiempo.",
        status: "published",
        scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
        platforms: ["facebook", "instagram", "tiktok"],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
      },
      {
        id: "queue-post-4",
        title: "Nuevos colores disponibles",
        content:
          "🌈 Llegaron los nuevos colores de temporada. Ven y descubre las últimas tendencias en esmaltes de uñas.",
        status: "failed",
        scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        platforms: ["instagram"],
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 días atrás
      },
      {
        id: "queue-post-5",
        title: "Tutorial de uñas decoradas",
        content:
          "Aprende a crear este diseño paso a paso. ¡Fácil y rápido para hacer en casa!",
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días desde ahora
        platforms: ["tiktok", "instagram"],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
      },
    ];

    // Aplicar filtros si se especifican
    let filteredPosts = demoPosts;

    if (status) {
      filteredPosts = filteredPosts.filter((post) => post.status === status);
    }

    if (platform) {
      filteredPosts = filteredPosts.filter((post) =>
        post.platforms.includes(platform),
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredPosts,
    });
  } catch (error) {
    console.error("Error fetching queue posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch queue posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // En un entorno real, aquí se guardaría el post en la base de datos
    // Por ahora, solo simularemos la operación
    console.log("Creating/updating post:", body);

    // Simular una respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        id: body.id || `post-${Date.now()}`,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error creating/updating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create/update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postIds = searchParams.get("ids")?.split(",") || [];

    if (postIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No post IDs provided" },
        { status: 400 },
      );
    }

    // En un entorno real, aquí se eliminarían los posts de la base de datos
    console.log("Deleting posts:", postIds);

    return NextResponse.json({
      success: true,
      message: `Deleted ${postIds.length} post${postIds.length !== 1 ? "s" : ""}`,
    });
  } catch (error) {
    console.error("Error deleting posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete posts" },
      { status: 500 },
    );
  }
}
