"use client";

import { useFeedbackWidget } from "./FeedbackWidgetContext";

interface ErrorInfo {
  digest?: string;
  message?: string;
  name?: string;
}

interface FeedbackErrorTriggerProps {
  error: ErrorInfo;
  label?: string;
}

export function FeedbackErrorTrigger({
  error,
  label = "Reportar problema",
}: FeedbackErrorTriggerProps) {
  const { open } = useFeedbackWidget();

  const handleClick = () => {
    open({
      category: "problema",
      message: `Error detectado${error.name ? `: ${error.name}` : ""}${error.message ? ` - ${error.message}` : ""}`,
      context: {
        source: "error_page",
        errorDigest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
      },
    });
  };

  return (
    <button
      data-testid="feedback-error-trigger"
      onClick={handleClick}
      className="inline-flex items-center justify-center px-4 py-3 bg-[#FF8000] hover:bg-[#E67300] text-white rounded-lg transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {label}
    </button>
  );
}
