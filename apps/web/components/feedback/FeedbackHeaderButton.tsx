"use client";

import { MessageSquare } from "lucide-react";
import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { useFeedbackWidget } from "./FeedbackWidgetContext";

interface FeedbackHeaderButtonProps {
  variant?: "default" | "transparent" | "dark";
}

export function FeedbackHeaderButton({}: FeedbackHeaderButtonProps) {
  const { open } = useFeedbackWidget();
  const tenantSlug = useTenantSlug();
  const isWondernails = tenantSlug === "wondernails";

  if (isWondernails) {
    return (
      <button
        type="button"
        onClick={() => open()}
        aria-label="Abrir asistente Wonder"
        data-testid="feedback-header-icon"
        className="w-10 h-10 rounded-full overflow-hidden transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 hover:scale-105"
      >
        <img
          src="/tenants/wondernails/assistant/wonder-avatar.webp"
          alt="Wonder, asistente IA de WonderNails"
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Danos tu feedback"
      data-testid="feedback-header-icon"
      className="p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50"
      style={{
        color: "var(--color-foreground)",
        backgroundColor: "var(--color-muted)",
      }}
    >
      <MessageSquare className="w-5 h-5" />
    </button>
  );
}
