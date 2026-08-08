"use client";

import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { useFeedbackWidget } from "@/components/feedback/FeedbackWidgetContext";
import { WonderChatPanel } from "./WonderChatPanel";

export function WonderAssistantWidget() {
  const {
    isOpen,
    open,
    close,
    initialCategory,
    initialContext,
    initialMessage,
  } = useFeedbackWidget();
  const tenantSlug = useTenantSlug();

  if (!tenantSlug) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => open()}
          aria-label="Abrir asistente Wonder"
          data-testid="wonder-assistant-trigger"
          className="wonder-float fixed bottom-4 right-4 z-40 rounded-full shadow-lg"
        >
          <img
            src="/tenants/wondernails/assistant/wonder-avatar.webp"
            alt="Wonder, asistente IA de WonderNails"
            className="w-16 h-16 rounded-full"
          />
        </button>
      )}

      {isOpen && (
        <WonderChatPanel
          tenantSlug={tenantSlug}
          initialCategory={initialCategory}
          initialMessage={initialMessage}
          initialContext={initialContext}
          onClose={close}
        />
      )}
    </>
  );
}
