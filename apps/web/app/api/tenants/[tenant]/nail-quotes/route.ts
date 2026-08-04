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
  createNailQuote,
  buildNailQuoteWhatsAppMessage,
} from "@/lib/customers/nail-quote-service";
import { enqueueScheduledNotification } from "@/lib/notifications/scheduled-notification-queue";
import { normalizeWhatsAppPhone } from "@/lib/customers/visit-utils";

const createNailQuoteSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  selectedOptionIds: z.array(z.string().uuid()).min(1),
  idempotencyKey: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    const bodyResult = await parseRequestBody(req, createNailQuoteSchema);
    if (!bodyResult.success) {
      return NextResponse.json(
        { success: false, error: bodyResult.error },
        { status: getHttpStatusCode(bodyResult.error) },
      );
    }
    const body = bodyResult.data;

    const result = await createNailQuote({
      tenantId,
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      selectedOptionIds: body.selectedOptionIds,
      idempotencyKey: body.idempotencyKey,
    });

    return match(result, {
      ok: (data: any) => {
        const { quote, lines } = data;
        const message = buildNailQuoteWhatsAppMessage(
          quote.customerName || "Cliente",
          lines.map((l: any) => ({
            optionId: l.optionId,
            category: l.category as any,
            key: l.key,
            label: l.label,
            unitPrice: Math.round(Number(l.unitPrice) * 100),
            durationMinutes: l.durationMinutes,
          })),
          Math.round(Number(quote.totalAmount) * 100),
          quote.durationMinutes,
        );

        const phone = normalizeWhatsAppPhone(quote.customerPhone || "");
        if (phone) {
          enqueueScheduledNotification({
            tenantId,
            channel: "whatsapp",
            recipientPhone: phone,
            recipientName: quote.customerName || undefined,
            body: message,
            templateKey: "nail_quote",
            relatedEntityType: "quote",
            relatedEntityId: quote.id,
            idempotencyKey: body.idempotencyKey
              ? `${body.idempotencyKey}:msg`
              : undefined,
            createdBy: "nail_quoter",
          }).catch(() => undefined);
        }

        return NextResponse.json({
          success: true,
          data: {
            quote,
            lines,
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
