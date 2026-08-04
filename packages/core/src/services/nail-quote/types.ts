/**
 * Nail quote domain types
 */

export type NailOptionCategory = "material" | "length" | "shape" | "addon";

export interface NailQuoteOption {
  id: string;
  tenantId: string;
  category: NailOptionCategory;
  key: string;
  label: string;
  basePrice: number; // cents
  baseDurationMinutes: number;
  imageUrl?: string;
  order: number;
  isActive: boolean;
}

export interface SelectedNailOption {
  optionId: string;
  category: NailOptionCategory;
  key: string;
  label: string;
  basePrice: number;
  baseDurationMinutes: number;
}

export interface NailQuoteLine {
  optionId: string;
  category: NailOptionCategory;
  key: string;
  label: string;
  unitPrice: number; // cents
  durationMinutes: number;
}

export interface NailQuoteCalculation {
  total: number; // cents
  durationMinutes: number;
  lines: NailQuoteLine[];
}
