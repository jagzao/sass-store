"use client";

/**
 * STRY-021 PR1 — Service selection step (extracted from book-calendar-client).
 *
 * Purely presentational: receives the current state and callbacks from the
 * parent and renders the service `<SearchableSelectSingle>` plus the meta
 * line. Behavior identical to the inline JSX it replaces.
 */
import { motion, type Variants } from "framer-motion";
import { SearchableSelectSingle } from "@/components/ui/forms/SearchableSelectSingle";
import type { SelectOption } from "@/components/ui/forms/SearchableSelect";
import { CTV_MUTED } from "@/lib/design/centro-tenistico-brand";
import { WN_MUTED } from "@/lib/design/wondernails-brand";

export interface ServiceStepProps {
  isCTV: boolean;
  isLuxury: boolean;
  isLightPanel: boolean;
  serviceOptions: SelectOption[];
  selectedServiceId: string;
  selectedServiceLabel: string;
  serviceMeta: string;
  onChange: (value: string) => void;
  panelItem: Variants;
}

export function ServiceStep({
  isCTV,
  isLuxury,
  isLightPanel,
  serviceOptions,
  selectedServiceId,
  selectedServiceLabel,
  serviceMeta,
  onChange,
  panelItem,
}: ServiceStepProps) {
  return (
    <motion.header
      variants={panelItem}
      className={
        isLightPanel
          ? "px-5 pt-5 pb-4 border-b border-stone-100"
          : "px-5 pt-5 pb-4 border-b border-white/[0.08]"
      }
    >
      <div data-testid="book-service-select">
        <SearchableSelectSingle
          placeholder="Buscar servicio..."
          isClearable={false}
          options={serviceOptions}
          value={
            selectedServiceId
              ? { value: selectedServiceId, label: selectedServiceLabel }
              : undefined
          }
          onChange={(v) => {
            const opt = v as SelectOption | null;
            if (!opt || typeof opt !== "object") return;
            onChange(String(opt.value));
          }}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
        />
      </div>
      <p
        className={`text-[11px] sm:text-xs mt-3 tracking-wide ${!isLightPanel ? "text-zinc-500" : ""}`}
        style={
          isCTV
            ? { color: CTV_MUTED }
            : isLuxury
              ? { color: WN_MUTED }
              : undefined
        }
      >
        {serviceMeta}
      </p>
    </motion.header>
  );
}
