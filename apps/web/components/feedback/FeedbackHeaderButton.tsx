"use client";

import { MessageSquare } from "lucide-react";
import { useFeedbackWidget } from "./FeedbackWidgetContext";

interface FeedbackHeaderButtonProps {
  variant?: "default" | "transparent" | "dark";
}

export function FeedbackHeaderButton({}: FeedbackHeaderButtonProps) {
  const { open } = useFeedbackWidget();

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
