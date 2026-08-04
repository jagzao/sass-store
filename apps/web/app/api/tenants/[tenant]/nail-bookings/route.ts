import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";
import { parseRequestBody } from "@sass-store/validation/src/zod-result";
import {
  DomainError,
  getHttpStatusCode,
} from "@sass-store/core/src/errors/types";
import { match } from "@sass-store/core/src/result";
import {
  createNailBooking,
  buildBookingConfirmationWhatsAppMessage,
} from "@/lib/customers/nail-quote-service";
import { enqueueScheduledNotification } from "@/lib/notifications/scheduled-notification-queue";
import { normalizeWhatsAppPhone } from "@/lib/customers/visit-utils";

const createNailBookingSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
  startTime: z.string().datetime(),
  staffId: z.string().uuid().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    const bodyResult = await parseRequestBody(req, createNailBookingSchema);
    if (!bodyResult.success) {
      return NextResponse.json(
        { success: false, error: bodyResult.error },
        { status: getHttpStatusCode(bodyResult.error) },
      );
    }
    const body = bodyResult.data;

    const result = await createNailBooking({
      tenantId,
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      selectedOptionIds: body.selectedOptionIds,
      startTime: new Date(body.startTime),
      staffId: body.staffId,
      notes: body.notes,
      idempotencyKey: body.idempotencyKey,
    });

    return match(result, {
      ok: (data: any) => {
        const { booking, deposit } = data;
        const message = buildBookingConfirmationWhatsAppMessage(
          booking.customerName,
          new Date(booking.startTime),
          !!deposit,
        );

        const phone = normalizeWhatsAppPhone(booking.customerPhone || "");
        if (phone) {
          enqueueScheduledNotification({
            tenantId,
            channel: "whatsapp",
            recipientPhone: phone,
            recipientName: booking.customerName,
            body: message,
            templateKey: "booking_confirmation",
            relatedEntityType: "booking",
            relatedEntityId: booking.id,
            idempotencyKey: body.idempotencyKey
              ? `${body.idempotencyKey}:msg`
              : undefined,
            createdBy: "nail_quoter",
          }).catch(() => undefined);
        }

        return NextResponse.json({
          success: true,
          data: {
            booking,
            deposit,
            message,
            whatsappUrl: phone
              ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
              : null,
          },
        });
      },
      err: (error: DomainError) =>
        NextResponse.json({ success: false, error } as any, {
          status: getHttpStatusCode(error),
        }) as any,
    });
  });
}
