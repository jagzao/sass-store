"use client";

import { useEffect } from "react";
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
  const { open, setErrorPage } = useFeedbackWidget();

  useEffect(() => {
    setErrorPage(true);
    return () => setErrorPage(false);
  }, [setErrorPage]);

  const MAX_ERROR_MESSAGE_LENGTH = 240;

  const sanitizeErrorMessage = (message?: string): string | undefined => {
    if (!message) return undefined;
    const withoutLocalPaths = message.replace(
      /\b\/[\w\-. ]+(?=\/|\s|$)/g,
      "[path]",
    );
    return withoutLocalPaths.slice(0, MAX_ERROR_MESSAGE_LENGTH);
  };

  const handleClick = () => {
    const safeMessage = sanitizeErrorMessage(error.message);
    open({
      category: "problema",
      message: `Error detectado${error.name ? `: ${error.name}` : ""}${safeMessage ? ` - ${safeMessage}` : ""}`,
      context: {
        source: "error_page",
        errorDigest: error.digest,
        errorName: error.name,
        errorMessage: safeMessage,
      },
    });
  };

  return (
    <button
      data-testid="feedback-error-trigger"
      onClick={handleClick}
      className="inline-flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
