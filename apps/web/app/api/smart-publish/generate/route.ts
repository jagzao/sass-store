import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "@/lib/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const N8N_WEBHOOK_URL = `${process.env.N8N_BASE_URL || "http://127.0.0.1:5678"}/webhook/smart-publish`;

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get("type") as "product" | "service";
    const price = parseFloat(formData.get("price") as string);
    const textDescription = (formData.get("textDescription") as string) || "";
    const image = formData.get("image") as File | null;

    if (!type || isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: "Se requiere tipo y precio válido" },
        { status: 400 },
      );
    }

    if (!textDescription.trim() && (!image || image.size === 0)) {
      return NextResponse.json(
        { error: "Proporciona al menos una foto o descripción de texto" },
        { status: 400 },
      );
    }

    // Upload image to Cloudinary if provided
    let imageUrl: string | null = null;
    if (image && image.size > 0 && image.type.startsWith("image/")) {
      try {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await new Promise<{ secure_url: string }>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "sass-store/smart-publish",
                  resource_type: "image",
                  transformation: [{ width: 1024, crop: "limit", quality: 85 }],
                },
                (err, result) => {
                  if (err) reject(err);
                  else if (result) resolve(result);
                  else reject(new Error("Upload failed"));
                },
              )
              .end(buffer);
          },
        );

        imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        logger.error("Cloudinary upload error in smart-publish", uploadErr);
        // Continue without image — AI will use text only
      }
    }

    // Call n8n webhook → Ollama AI generation
    const n8nPayload = {
      type,
      price,
      textDescription: textDescription.trim() || null,
      imageUrl,
    };

    let aiResult: Record<string, unknown>;
    try {
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
        signal: AbortSignal.timeout(90_000),
      });

      if (!n8nRes.ok) {
        throw new Error(`n8n returned ${n8nRes.status}`);
      }

      aiResult = await n8nRes.json();
    } catch (n8nErr) {
      logger.error("n8n/Ollama call failed", n8nErr);
      // Fallback: return structured placeholder so the user can still fill in manually
      const fallbackName =
        textDescription.trim().substring(0, 60) ||
        (type === "product" ? "Nuevo Producto" : "Nuevo Servicio");
      aiResult = {
        success: false,
        fallback: true,
        name: fallbackName,
        description: textDescription.trim() || "",
        shortDescription: "",
        category: "General",
        suggestedSku: `ITEM-${Date.now()}`,
      };
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      ai: {
        name: aiResult.name as string,
        description: aiResult.description as string,
        shortDescription: (aiResult.shortDescription as string) || "",
        category: (aiResult.category as string) || "General",
        suggestedSku: (aiResult.suggestedSku as string) || `ITEM-${Date.now()}`,
        fallback: aiResult.fallback === true,
      },
    });
  } catch (error) {
    logger.error("Smart publish generate error", error);
    return NextResponse.json(
      {
        error: "Error al generar contenido",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
