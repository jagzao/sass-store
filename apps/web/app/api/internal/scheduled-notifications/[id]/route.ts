import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeInternalRequest } from "@/lib/notifications/internal-api-auth";
import {
  markNotificationFailed,
  markNotificationProcessing,
  markNotificationSent,
} from "@/lib/notifications/scheduled-notification-queue";

const patchBodySchema = z.object({
  action: z.enum(["processing", "sent", "failed"]),
  externalMessageId: z.string().max(100).optional(),
  lastError: z.string().max(2000).optional(),
});

/**
 * PATCH /api/internal/scheduled-notifications/:id
 *
 * Actualiza estado tras procesamiento n8n.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = patchBodySchema.parse(await request.json());

    let row;
    switch (body.action) {
      case "processing":
        row = await markNotificationProcessing(id);
        break;
      case "sent":
        row = await markNotificationSent(id, body.externalMessageId);
        break;
      case "failed":
        row = await markNotificationFailed(
          id,
          body.lastError ?? "Error desconocido",
        );
        break;
    }

    if (!row) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", details: error.errors },
        { status: 400 },
      );
    }
    console.error("scheduled-notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
