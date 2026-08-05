"use client";

/**
 * STRY-021 PR1 — Customer data + confirm step (extracted from book-calendar-client).
 *
 * Purely presentational: renders the guest fields panel (name / phone / email /
 * notes), the customer-match suggestions block, and the success/error messages.
 * The submit button stays inline in the parent so the panel's motion stagger
 * sequence is preserved byte-for-byte (PR1 = cero cambio de comportamiento).
 */
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { CTV_INK, CTV_MUTED } from "@/lib/design/centro-tenistico-brand";
import { WN_CHARCOAL, WN_GOLD } from "@/lib/design/wondernails-brand";

export interface CustomerMatch {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  reasons: string[];
}

export interface CustomerConfirmStepProps {
  isCTV: boolean;
  isLuxury: boolean;
  isLightPanel: boolean;
  inputClass: string;
  lightInputClass: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  customerMatches: CustomerMatch[];
  linkedCustomerId: string | null;
  errorMessage: string;
  successMessage: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onPickMatch: (id: string | null) => void;
  formatPhoneDisplay: (raw: string) => string;
  phoneInputRef: (node: HTMLInputElement | null) => void;
}

export function CustomerConfirmStep({
  isCTV,
  isLuxury,
  isLightPanel,
  inputClass,
  lightInputClass,
  customerName,
  customerPhone,
  customerEmail,
  notes,
  customerMatches,
  linkedCustomerId,
  errorMessage,
  successMessage,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onNotesChange,
  onPickMatch,
  formatPhoneDisplay,
  phoneInputRef,
}: CustomerConfirmStepProps) {
  const panelStyle: CSSProperties | undefined = isCTV
    ? { color: CTV_INK }
    : isLuxury
      ? { color: WN_CHARCOAL }
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.08,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={
        isLightPanel
          ? "rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-[0_16px_40px_-28px_rgba(160,130,180,0.12)]"
          : "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm"
      }
      data-testid="book-customer-fields"
      style={panelStyle}
    >
      <h3
        className={
          isLightPanel
            ? "mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
            : "mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
        }
        style={
          isCTV
            ? { color: CTV_MUTED }
            : isLuxury
              ? { color: WN_GOLD }
              : undefined
        }
      >
        Tus datos
      </h3>
      {customerMatches.length > 0 ? (
        <div
          className="mb-4 rounded-xl border border-[#C5A059]/25 bg-[#C5A059]/5 p-3 space-y-2"
          data-testid="book-customer-matches"
        >
          <p className="text-xs font-medium text-[#333333]">
            ¿Ya eres nuestra clienta? Selecciona tu perfil para vincular la
            cita:
          </p>
          {customerMatches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                onPickMatch(linkedCustomerId === m.id ? null : m.id)
              }
              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                linkedCustomerId === m.id
                  ? "border-[#C5A059] bg-white ring-1 ring-[#C5A059]/40"
                  : "border-gray-200 bg-white hover:border-[#C5A059]/40"
              }`}
            >
              <span className="font-medium text-[#333333]">{m.name}</span>
              {m.phone ? (
                <span className="block text-xs text-gray-500">{m.phone}</span>
              ) : null}
              <span className="text-[10px] text-gray-400">
                Coincide: {m.reasons.join(", ")}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPickMatch(null)}
            className="text-xs text-gray-500 underline"
          >
            Reservar como clienta nueva
          </button>
        </div>
      ) : null}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <input
          type="text"
          value={customerName}
          onChange={(event) => onNameChange(event.target.value)}
          className={isLightPanel ? inputClass : lightInputClass}
          placeholder="Nombre completo"
          data-testid="book-customer-name"
          required
        />
        <input
          ref={phoneInputRef}
          type="tel"
          inputMode="numeric"
          value={formatPhoneDisplay(customerPhone)}
          onChange={(event) => {
            const raw = event.target.value;
            const digits = raw.replace(/\D/g, "").slice(0, 15);
            onPhoneChange(digits);
          }}
          className={isLightPanel ? inputClass : lightInputClass}
          placeholder="Teléfono"
          data-testid="book-customer-phone"
          required
        />
        <input
          type="email"
          value={customerEmail}
          onChange={(event) => {
            const email = event.target.value.toLowerCase().trimStart();
            onEmailChange(email);
          }}
          onBlur={() => onEmailChange(customerEmail.trim())}
          className={isLightPanel ? inputClass : lightInputClass}
          placeholder="Email (opcional)"
          data-testid="book-customer-email"
        />
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className={`${isLightPanel ? inputClass : lightInputClass} resize-none`}
          placeholder="Notas (opcional)"
          data-testid="book-customer-notes"
          rows={3}
        />
      </div>

      {errorMessage ? (
        <p
          className={`text-sm mt-3 ${isCTV ? "text-red-700" : "text-red-400"}`}
          data-testid="book-error"
        >
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p
          className={`text-sm mt-3 ${isCTV ? "text-emerald-700" : "text-emerald-500"}`}
          data-testid="book-success"
        >
          {successMessage}
        </p>
      ) : null}
    </motion.div>
  );
}
