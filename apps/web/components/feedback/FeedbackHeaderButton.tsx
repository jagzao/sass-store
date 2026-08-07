"use client";

import { MessageSquare } from "lucide-react";
import { useFeedbackWidget } from "./FeedbackWidgetContext";

interface FeedbackHeaderButtonProps {
  variant?: "default" | "transparent" | "dark";
}

export function FeedbackHeaderButton({
  variant = "default",
}: FeedbackHeaderButtonProps) {
  const { open } = useFeedbackWidget();
  const isLight = variant === "dark" || variant === "transparent";

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Danos tu feedback"
      data-testid="feedback-header-icon"
      className={`p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]/50 ${
        isLight
          ? "text-white hover:bg-white/10"
          : "text-gray-700 hover:bg-black/5"
      }`}
    >
      <MessageSquare className="w-5 h-5" />
    </button>
  );
}
