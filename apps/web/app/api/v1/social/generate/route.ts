import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objective, platforms, startDate, endDate, frequency, contentMix } =
      body;

    // Validar datos de entrada
    if (!objective || !platforms || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // En un entorno real, aquí se llamaría a una API de IA como OpenAI, Anthropic, etc.
    // Por ahora, generaremos contenido de demostración basado en los parámetros

    const generatedPosts = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calcular cuántos posts generar según la frecuencia
    const postsPerWeek = frequency?.postsPerWeek || 3;
    const reelsPerWeek = frequency?.reelsPerWeek || 1;
    const storiesPerWeek = frequency?.storiesPerWeek || 2;

    const totalPosts = Math.floor((daysDiff / 7) * postsPerWeek);
    const totalReels = Math.floor((daysDiff / 7) * reelsPerWeek);
    const totalStories = Math.floor((daysDiff / 7) * storiesPerWeek);

    // Generar posts
    for (let i = 0; i < totalPosts; i++) {
      const postDate = new Date(start);
      postDate.setDate(
        postDate.getDate() + Math.floor(Math.random() * daysDiff),
      );

      // Seleccionar plataformas aleatorias de las proporcionadas
      const selectedPlatforms = platforms
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * platforms.length) + 1);

      // Generar contenido basado en el objetivo
      let content = "";
      switch (objective) {
        case "sales":
          content = `✨ Oferta especial en nuestros servicios de uñas. ¡Resultados profesionales que te harán brillar! Agenda tu cita hoy. #WonderNails #Belleza`;
          break;
        case "brand":
          content = `En WonderNails creemos en la belleza única de cada persona. Nuestros artistas están listos para realzar tu estilo. #WonderNails #EstiloUnico`;
          break;
        case "educational":
          content = `💡 ¿Sabías que...? El uso de base coat antes del esmalte protege tus uñas y ayuda a que el color dure más tiempo. #Consejos #WonderNails`;
          break;
        default:
          content = `Descubre la experiencia WonderNails. Calidad, estilo y profesionalidad en cada detalle. ¡Te esperamos! #WonderNails`;
      }

      generatedPosts.push({
        id: `generated-post-${i}`,
        title: `Publicación generada ${i + 1}`,
        content,
        platforms: selectedPlatforms,
        format: "post",
        scheduledAt: postDate,
        status: "draft",
      });
    }

    // Generar reels
    for (let i = 0; i < totalReels; i++) {
      const postDate = new Date(start);
      postDate.setDate(
        postDate.getDate() + Math.floor(Math.random() * daysDiff),
      );

      const selectedPlatforms = platforms
        .filter((p: string) => ["instagram", "tiktok"].includes(p))
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 1);

      generatedPosts.push({
        id: `generated-reel-${i}`,
        title: `Reel generado ${i + 1}`,
        content: `✨ Transformación increíble en este reel. ¡De simple a espectacular en segundos! #Transformacion #WonderNails`,
        platforms: selectedPlatforms,
        format: "reel",
        scheduledAt: postDate,
        status: "draft",
      });
    }

    // Generar stories
    for (let i = 0; i < totalStories; i++) {
      const postDate = new Date(start);
      postDate.setDate(
        postDate.getDate() + Math.floor(Math.random() * daysDiff),
      );

      const selectedPlatforms = platforms
        .filter((p: string) => ["instagram", "facebook"].includes(p))
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 1);

      generatedPosts.push({
        id: `generated-story-${i}`,
        title: `Story generado ${i + 1}`,
        content: `🔥 ¡Nuevo color disponible! Ven y descubre nuestra última colección. #WonderNails #NuevosColores`,
        platforms: selectedPlatforms,
        format: "story",
        scheduledAt: postDate,
        status: "draft",
      });
    }

    // Ordenar por fecha
    generatedPosts.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      data: {
        generatedPosts,
        summary: {
          totalPosts: generatedPosts.length,
          postsByFormat: {
            post: totalPosts,
            reel: totalReels,
            story: totalStories,
          },
          dateRange: {
            start: startDate,
            end: endDate,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
