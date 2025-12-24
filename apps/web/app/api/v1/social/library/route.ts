import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // En un entorno real, aquí se consultaría la base de datos
    // Por ahora, devolveremos datos de demostración
    const demoContent = [
      {
        id: "lib-1",
        title: "Promoción de servicios",
        content:
          "✨ Oferta especial en nuestros servicios de uñas. ¡Resultados profesionales que te harán brillar! Agenda tu cita hoy. #WonderNails #Belleza",
        format: "post",
        platforms: ["facebook", "instagram"],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        usageCount: 8,
      },
      {
        id: "lib-2",
        title: "Transformación increíble",
        content:
          "Mira el cambio espectacular de nuestra clienta. ¡De simple a espectacular en una sola sesión! 💅✨ #Transformación #BeforeAfter",
        format: "reel",
        platforms: ["instagram", "tiktok"],
        mediaUrl: "/placeholder-video.jpg",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        usageCount: 12,
      },
      {
        id: "lib-3",
        title: "Tip del día",
        content:
          "💡 ¿Sabías que...? El uso de base coat antes del esmalte protege tus uñas y ayuda a que el color dure más tiempo.",
        format: "story",
        platforms: ["instagram", "facebook"],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        usageCount: 5,
      },
      {
        id: "lib-4",
        title: "Tutorial de uñas",
        content:
          "Aprende a conseguir el acabado perfecto en casa con nuestros consejos profesionales. En este video te mostramos paso a paso.",
        format: "video",
        platforms: ["instagram", "tiktok", "youtube"],
        mediaUrl: "/placeholder-video.jpg",
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        usageCount: 15,
      },
      {
        id: "lib-5",
        title: "Nuevos colores",
        content:
          "¡Llegaron los nuevos colores de temporada! 🌈 Tonos vibrantes y elegantes para que elijas tu próximo look. #NuevosColores #Tendencias",
        format: "post",
        platforms: ["facebook", "instagram", "tiktok"],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        usageCount: 6,
      },
    ];

    return NextResponse.json({
      success: true,
      data: demoContent,
    });
  } catch (error) {
    console.error("Error fetching library content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch library content" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // En un entorno real, aquí se guardaría el contenido en la biblioteca
    console.log("Saving content to library:", body);

    // Simular una respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        id: `lib-${Date.now()}`,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      },
    });
  } catch (error) {
    console.error("Error saving content to library:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save content to library" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Content ID is required" },
        { status: 400 },
      );
    }

    // En un entorno real, aquí se actualizaría el contenido en la biblioteca
    console.log("Updating library content:", body);

    return NextResponse.json({
      success: true,
      data: {
        id,
        ...body,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating library content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update library content" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("id");

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "Content ID is required" },
        { status: 400 },
      );
    }

    // En un entorno real, aquí se eliminaría el contenido de la biblioteca
    console.log("Deleting library content:", contentId);

    return NextResponse.json({
      success: true,
      message: `Content ${contentId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting library content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete library content" },
      { status: 500 },
    );
  }
}
