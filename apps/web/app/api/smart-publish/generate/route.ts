import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "@/lib/logger";
import { auth } from "@sass-store/config/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const N8N_WEBHOOK_URL = `${process.env.N8N_BASE_URL || "http://127.0.0.1:5678"}/webhook/smart-publish`;

// Tier 2: Local Ollama (same machine as Next.js)
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2-vision:latest";

// Tier 3: Ollama Cloud (OpenAI-compatible provider)
const OLLAMA_CLOUD_BASE_URL =
  process.env.OLLAMA_CLOUD_BASE_URL || "https://ollama.com/v1";
const OLLAMA_CLOUD_API_KEY = process.env.OLLAMA_CLOUD_API_KEY || "";
const OLLAMA_CLOUD_MODEL =
  process.env.OLLAMA_CLOUD_MODEL || "qwen3-coder:480b-cloud";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    let aiResult: Record<string, unknown> = {
      success: false,
      fallback: true,
      name:
        textDescription.trim().substring(0, 60) ||
        (type === "product" ? "Nuevo Producto" : "Nuevo Servicio"),
      description: textDescription.trim() || "",
      shortDescription: "",
      category: "General",
      suggestedSku: `ITEM-${Date.now()}`,
    };

    // ── 1. Try n8n (orchestration path) ─────────────────────────────────────
    let n8nSucceeded = false;
    try {
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
        signal: AbortSignal.timeout(90_000),
      });

      if (n8nRes.ok) {
        const text = await n8nRes.text();
        if (text.trim()) {
          aiResult = JSON.parse(text);
          n8nSucceeded = true;
        }
      }
    } catch (n8nErr) {
      logger.warn("n8n call failed, falling back to direct Ollama", n8nErr);
    }

    // ── 2. Direct Ollama fallback (Next.js → localhost:11434) ────────────────
    if (!n8nSucceeded) {
      try {
        const typeLabel = type === "product" ? "producto" : "servicio";
        const systemPrompt = `Eres un experto en marketing y copywriting para pequeños negocios en México y Latinoamérica.
Tu misión: generar nombres atractivos y descripciones persuasivas que vendan.
Siempre responde SOLO con JSON válido, sin texto extra, sin markdown, sin bloques de código.`;

        const userPrompt = `Analiza este ${typeLabel} y genera contenido profesional para venderlo online.

Datos del ${typeLabel}:
- Tipo: ${typeLabel}
- Precio: $${price} MXN${textDescription.trim() ? `\n- Descripción del propietario: "${textDescription.trim()}"` : ""}

Responde ÚNICAMENTE con este JSON exacto (sin nada más):
{
  "name": "nombre corto y atractivo (máximo 60 caracteres)",
  "description": "descripción profesional y persuasiva de 80-150 palabras, destaca beneficios y valor",
  "shortDescription": "frase de venta poderosa para redes sociales (máximo 140 caracteres)",
  "category": "categoría del ${typeLabel} en 1-3 palabras",
  "suggestedSku": "código identificador en mayúsculas sin espacios, ejemplo: BOLSA-ARTESANAL-01"
}`;

        const messages: Array<{ role: string; content: unknown }> = [];
        if (imageUrl) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          });
        } else {
          messages.push({ role: "user", content: userPrompt });
        }

        const ollamaRes = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            stream: false,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(90_000),
        });

        if (!ollamaRes.ok)
          throw new Error(`Ollama returned ${ollamaRes.status}`);

        const ollamaJson = await ollamaRes.json();
        const rawContent: string = ollamaJson.choices[0].message.content;
        const cleaned = rawContent
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        const parsed = JSON.parse(cleaned);

        aiResult = {
          success: true,
          name: (parsed.name || "").substring(0, 200),
          description: parsed.description || "",
          shortDescription: (parsed.shortDescription || "").substring(0, 140),
          category: (parsed.category || "General").substring(0, 50),
          suggestedSku: (parsed.suggestedSku || `ITEM-${Date.now()}`)
            .replace(/\s+/g, "-")
            .toUpperCase(),
        };
      } catch (ollamaLocalErr) {
        logger.warn("Local Ollama failed, trying cloud", ollamaLocalErr);

        // ── 3. Ollama Cloud fallback (https://ollama.com/v1) ─────────────────
        if (OLLAMA_CLOUD_API_KEY) {
          try {
            const cloudMessages: Array<{ role: string; content: unknown }> = [];
            const typeLabel = type === "product" ? "producto" : "servicio";
            const systemPrompt = `Eres un experto en marketing y copywriting para pequeños negocios en México y Latinoamérica.
Tu misión: generar nombres atractivos y descripciones persuasivas que vendan.
Siempre responde SOLO con JSON válido, sin texto extra, sin markdown, sin bloques de código.`;
            const userPrompt = `Analiza este ${typeLabel} y genera contenido para venderlo online.
Datos: tipo=${typeLabel}, precio=$${price} MXN${textDescription.trim() ? `, descripción="${textDescription.trim()}"` : ""}.
Responde SOLO con JSON: {"name":"...","description":"...","shortDescription":"...","category":"...","suggestedSku":"..."}`;

            if (imageUrl) {
              cloudMessages.push({
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  { type: "image_url", image_url: { url: imageUrl } },
                ],
              });
            } else {
              cloudMessages.push({ role: "user", content: userPrompt });
            }

            const cloudRes = await fetch(
              `${OLLAMA_CLOUD_BASE_URL}/chat/completions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${OLLAMA_CLOUD_API_KEY}`,
                },
                body: JSON.stringify({
                  model: OLLAMA_CLOUD_MODEL,
                  messages: [
                    { role: "system", content: systemPrompt },
                    ...cloudMessages,
                  ],
                  stream: false,
                  temperature: 0.7,
                }),
                signal: AbortSignal.timeout(90_000),
              },
            );

            if (!cloudRes.ok)
              throw new Error(`Ollama cloud returned ${cloudRes.status}`);

            const cloudJson = await cloudRes.json();
            const rawCloud: string = cloudJson.choices[0].message.content;
            const cleanedCloud = rawCloud
              .replace(/```json\s*/gi, "")
              .replace(/```\s*/g, "")
              .trim();
            const parsedCloud = JSON.parse(cleanedCloud);

            aiResult = {
              success: true,
              name: (parsedCloud.name || "").substring(0, 200),
              description: parsedCloud.description || "",
              shortDescription: (parsedCloud.shortDescription || "").substring(
                0,
                140,
              ),
              category: (parsedCloud.category || "General").substring(0, 50),
              suggestedSku: (parsedCloud.suggestedSku || `ITEM-${Date.now()}`)
                .replace(/\s+/g, "-")
                .toUpperCase(),
            };
          } catch (cloudErr) {
            logger.error("Ollama cloud also failed", cloudErr);
            // ── 4. Graceful text placeholder ──────────────────────────────
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
        } else {
          // No cloud key configured → text placeholder
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
      }
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
