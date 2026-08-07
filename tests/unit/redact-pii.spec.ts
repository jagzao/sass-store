import { describe, expect, it } from "vitest";
import {
  redactPII,
  type MetaWebhookPayload,
} from "../../apps/web/lib/wa/redact-pii";

/**
 * STRY-021 SC-18 — redactPII must strip every PII-bearing field.
 * The redacted payload may only keep: object, entry ids, messaging_product,
 * metadata (display_phone_number, phone_number_id), message id/timestamp/type.
 */
describe("redactPII", () => {
  const payload: MetaWebhookPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry-1",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550422180",
                phone_number_id: "106940",
              },
              messages: [
                {
                  from: "5512345678",
                  id: "wamid.HBgM",
                  timestamp: "1720000000",
                  type: "button",
                  text: { body: "secret message body" },
                  button: { payload: "cancel|R1|tok", text: "No" },
                },
              ],
              contacts: [{ wa_id: "5512345678", profile: { name: "Ana" } }],
            },
          },
        ],
      },
    ],
  };

  it("removes message.from, text.body, button.payload, contacts", () => {
    const redacted = redactPII(payload);
    const serialized = JSON.stringify(redacted);

    expect(serialized).not.toContain("5512345678");
    expect(serialized).not.toContain("secret message body");
    expect(serialized).not.toContain("cancel|R1|tok");
    expect(serialized).not.toContain("Ana");
    expect(serialized).not.toContain("wa_id");
    expect(serialized).not.toContain('"from"');
    expect(serialized).not.toContain('"body"');
    expect(serialized).not.toContain('"payload"');
  });

  it("keeps operational metadata needed for debugging", () => {
    const redacted = redactPII(payload);
    const serialized = JSON.stringify(redacted);

    expect(serialized).toContain("whatsapp_business_account");
    expect(serialized).toContain("entry-1");
    expect(serialized).toContain("phone_number_id");
    expect(serialized).toContain("106940");
    expect(serialized).toContain("wamid.HBgM");
    expect(serialized).toContain("1720000000");
    expect(serialized).toContain('"type":"button"');
  });

  it("handles missing messages gracefully", () => {
    const minimal: MetaWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "e",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "1", phone_number_id: "2" },
              },
            },
          ],
        },
      ],
    };
    const redacted = redactPII(minimal);
    expect(redacted.entry?.[0].changes?.[0].value.messages).toBeUndefined();
  });
});
