"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

import {
  CreateFeedbackInput,
  FeedbackCategory,
} from "@sass-store/validation/src/feedback";

type Category = FeedbackCategory;

interface OpenOptions {
  category?: Category;
  context?: CreateFeedbackInput["context"];
  message?: string;
}

interface FeedbackWidgetContextValue {
  isOpen: boolean;
  open: (options?: OpenOptions) => void;
  close: () => void;
  initialCategory: Category;
  initialContext: Record<string, unknown>;
  initialMessage: string;
}

const FeedbackWidgetContext = createContext<FeedbackWidgetContextValue | null>(
  null,
);

export function FeedbackWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<Category>("opinion");
  const [initialContext, setInitialContext] = useState<Record<string, unknown>>(
    {},
  );
  const [initialMessage, setInitialMessage] = useState("");

  const open = useCallback((options: OpenOptions = {}) => {
    setInitialCategory(options.category ?? "opinion");
    setInitialContext(options.context ?? {});
    setInitialMessage(options.message ?? "");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FeedbackWidgetContext.Provider
      value={{
        isOpen,
        open,
        close,
        initialCategory,
        initialContext,
        initialMessage,
      }}
    >
      {children}
    </FeedbackWidgetContext.Provider>
  );
}

export function useFeedbackWidget() {
  const ctx = useContext(FeedbackWidgetContext);
  if (!ctx) {
    throw new Error(
      "useFeedbackWidget must be used inside FeedbackWidgetProvider",
    );
  }
  return ctx;
}
