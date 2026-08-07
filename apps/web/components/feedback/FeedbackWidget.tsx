"use client";

import { useTenantSlug } from "@/lib/tenant/client-resolver";
import { useFeedbackWidget } from "./FeedbackWidgetContext";
import { FeedbackForm } from "./FeedbackForm";

export function FeedbackWidget() {
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
          aria-label="Abrir feedback"
          className="fixed bottom-4 right-4 z-40 bg-[#FF8000] hover:bg-[#E67300] text-white rounded-full p-4 shadow-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#FF8000] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold">Tu opinión nos ayuda a mejorar</h3>
            <button
              onClick={() => close()}
              aria-label="Cerrar feedback"
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>

          <FeedbackForm
            initialCategory={initialCategory}
            initialMessage={initialMessage}
            initialContext={initialContext}
            onSubmitted={close}
          />
        </div>
      )}
    </>
  );
}
