"use client";

import { useState, useRef, useEffect } from "react";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import type { FeedbackCategory } from "@sass-store/validation/src/feedback";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface WonderChatPanelProps {
  tenantSlug: string;
  initialCategory: FeedbackCategory;
  initialMessage: string;
  initialContext: Record<string, unknown>;
  onClose: () => void;
}

const WELCOME_MESSAGE =
  "¡Hola! Soy Wonder 🐾 Pregúntame sobre nuestros servicios, horarios o lo que necesites.";

export function WonderChatPanel({
  tenantSlug,
  initialCategory,
  initialMessage,
  initialContext,
  onClose,
}: WonderChatPanelProps) {
  const isErrorReport =
    initialCategory === "problema" ||
    initialMessage.length > 0 ||
    Object.keys(initialContext).length > 0;

  const [view, setView] = useState<"chat" | "feedback">(
    isErrorReport ? "feedback" : "chat",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages, view]);

  const hasAssistantReply = messages.some((m) => m.role === "assistant");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          message: text,
          history: nextMessages.slice(-6),
          sessionId,
        }),
      });

      const data = await response.json().catch(() => ({ success: false }));

      if (response.ok && data.success && data.data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Wonder no puede responder en este momento 🐾",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Wonder no puede responder en este momento 🐾",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      data-testid="wonder-chat-panel"
      className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col"
    >
      <div className="bg-[#FF8000] text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src="/tenants/wondernails/assistant/wonder-avatar.webp"
            alt=""
            className="w-7 h-7 rounded-full"
          />
          <h3 className="font-semibold">Wonder</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar chat de Wonder"
          className="text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>

      {view === "chat" ? (
        <>
          <div
            ref={listRef}
            data-testid="wonder-chat-messages"
            className="flex-1 max-h-80 overflow-y-auto p-4 space-y-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[#FF8000] text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {hasAssistantReply && (
            <div
              data-testid="chat-feedback-prompt"
              className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600"
            >
              <span>¿Te ayudó?</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Sí me ayudó"
                  className="hover:opacity-70"
                >
                  👍
                </button>
                <button
                  type="button"
                  aria-label="No me ayudó"
                  className="hover:opacity-70"
                >
                  👎
                </button>
                <button
                  type="button"
                  onClick={() => setView("feedback")}
                  className="text-[#FF8000] font-medium hover:underline"
                >
                  Enviar comentario
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="p-3 border-t border-gray-200 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escríbele a Wonder..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8000] text-gray-900 text-sm"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Enviar mensaje"
              className="bg-[#FF8000] hover:bg-[#E67300] disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-md transition-colors text-sm"
            >
              {sending ? "..." : "Enviar"}
            </button>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setView("chat")}
            className="text-left text-sm text-[#FF8000] px-4 pt-3 hover:underline"
          >
            ← Volver al chat
          </button>
          <FeedbackForm
            initialCategory={initialCategory}
            initialMessage={initialMessage}
            initialContext={initialContext}
            onSubmitted={() => setView("chat")}
          />
        </>
      )}
    </div>
  );
}
