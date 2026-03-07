// Re-export from the monolith-local FinancialMatrixService
// This file previously pointed to apps/api - now uses local implementation
export { financialMatrixService, FinancialMatrixService } from "./FinancialMatrixService";
export type {
  FinancialMatrixRepository,
  MatrixLoadParams,
  MatrixCategory,
  MatrixCell,
  MatrixData,
  UpsertProjectedCellInput,
  UpsertProjectedCellOutput,
  MarkPaidInput,
  MarkPaidOutput,
  CloneMonthInput,
  CloneMonthOutput,
} from "./FinancialMatrixService";
