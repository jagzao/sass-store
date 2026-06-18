export type Person = 'Ali' | 'Juan' | 'Compartido';

export type Category =
  | 'prestamo'
  | 'tarjeta'
  | 'servicio'
  | 'vivienda'
  | 'educacion'
  | 'mercado'
  | 'kids'
  | 'otro';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  totalDebt?: number;
  dueDay?: number;
  dueMonthLabel?: string;
  isRecurring: boolean;
  person: Person;
  category: Category;
  isPaid: boolean;
  notes?: string;
  isCreditCard?: boolean;
  isAmountPending?: boolean;
}

export interface BudgetPeriod {
  id: string;
  label: string;
  shortLabel: string;
  day: 1 | 15;
  month: number;
  year: number;
  expenses: Expense[];
}

export type FilterPerson = Person | 'Todos';
