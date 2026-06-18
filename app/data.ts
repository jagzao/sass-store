import type { BudgetPeriod, Expense } from './types';

export const BIWEEKLY_BUDGET = 42000;

const jun1: Expense[] = [
  { id: 'j1-merc-ali',  name: 'Mercado Ali 4482',      amount: 905,   dueDay: 1,  dueMonthLabel: 'Jun', isRecurring: true,  person: 'Ali',        category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j1-sears',     name: 'Sears 3509 Didi Juan',  amount: 0,                                        isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true, isAmountPending: true },
  { id: 'j1-bbva',      name: 'BBVA 9091',             amount: 591,   dueDay: 12, dueMonthLabel: 'Jun', isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j1-databliz',  name: 'DataBliz → Blanquita',  amount: 12000,                                    isRecurring: false, person: 'Compartido', category: 'servicio', isPaid: false },
  { id: 'j1-nu-ali',    name: 'Nu Ali 3043',           amount: 383,   dueDay: 5,  dueMonthLabel: 'Jun', isRecurring: false, person: 'Ali',        category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j1-walmart',   name: 'Walmart',               amount: 3000,                                     isRecurring: false, person: 'Compartido', category: 'mercado',  isPaid: false },
  { id: 'j1-didi-ali',  name: 'Didi Ali',              amount: 0,                                        isRecurring: false, person: 'Ali',        category: 'otro',     isPaid: false, isAmountPending: true },
  { id: 'j1-suburbia',  name: 'Suburbia',              amount: 0,                                        isRecurring: false, person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true, isAmountPending: true },
  { id: 'j1-dp-ali',    name: 'Didi Préstamo Ali',     amount: 2642,                                     isRecurring: true,  person: 'Ali',        category: 'prestamo', isPaid: false },
  { id: 'j1-dp-juan',   name: 'Didi Préstamo Juan',    amount: 1646,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'j1-story',     name: 'Juan Story Préstamo',   amount: 1383,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'j1-ferreira',  name: 'Ser Ferreira',          amount: 2800,                                     isRecurring: true,  person: 'Compartido', category: 'servicio', isPaid: false },
  { id: 'j1-didi-juan', name: 'Didi Juan (Tarjeta)',   amount: 2441,  dueDay: 11, dueMonthLabel: 'Jun', isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 6305,  notes: 'Resta $6,305' },
  { id: 'j1-klar',      name: 'Klar',                  amount: 7300,                                     isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 21500 },
  { id: 'j1-azteca',    name: 'Azteca',                amount: 4250,                                     isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false },
  { id: 'j1-mercado',   name: 'Mercado',               amount: 3000,                                     isRecurring: true,  person: 'Compartido', category: 'mercado',  isPaid: false },
  { id: 'j1-kids',      name: 'Kids',                  amount: 1000,                                     isRecurring: true,  person: 'Compartido', category: 'kids',     isPaid: false },
];

const jun15: Expense[] = [
  { id: 'j15-dp-ali',    name: 'Didi Préstamo Ali',    amount: 2642,                                     isRecurring: true,  person: 'Ali',        category: 'prestamo', isPaid: false },
  { id: 'j15-dp-juan',   name: 'Didi Préstamo Juan',   amount: 1646,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'j15-story',     name: 'Juan Story Préstamo',  amount: 1383,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'j15-nu-juan',   name: 'Nu Juan',              amount: 1410,                                     isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-story-card',name: 'Story',                amount: 1170,  dueDay: 17, dueMonthLabel: 'Jun', isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-vexi',      name: 'Vexi',                 amount: 3800,  dueDay: 18, dueMonthLabel: 'Jun', isRecurring: false, person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-bradescard',name: 'Bradescard',           amount: 936,   dueDay: 18, dueMonthLabel: 'Jun', isRecurring: false, person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-uala',      name: 'Uala (Walmart)',       amount: 2912,  dueDay: 15, dueMonthLabel: 'Jun', isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-casa',      name: 'Casa',                 amount: 13000,                                    isRecurring: true,  person: 'Compartido', category: 'vivienda', isPaid: false },
  { id: 'j15-plata-ali', name: 'Plata Ali',            amount: 200,   dueDay: 24, dueMonthLabel: 'Jun', isRecurring: true,  person: 'Ali',        category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 1874,  notes: 'Pago mínimo' },
  { id: 'j15-plata-juan',name: 'Plata Juan',           amount: 1407,  dueDay: 15, dueMonthLabel: 'Jun', isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-uvm',       name: 'Pily UVM',             amount: 3700,                                     isRecurring: true,  person: 'Compartido', category: 'educacion',isPaid: false },
  { id: 'j15-merc-juan', name: 'Mercado Juan',         amount: 13015, dueDay: 22, dueMonthLabel: 'Jun', isRecurring: false, person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'j15-merc-kids', name: 'Mercado + Kids',       amount: 4000,                                     isRecurring: true,  person: 'Compartido', category: 'mercado',  isPaid: false },
  { id: 'j15-azteca',    name: 'Azteca',               amount: 4250,                                     isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false },
  { id: 'j15-sra-mari',  name: 'Sra. Marí',            amount: 2400,                                     isRecurring: true,  person: 'Compartido', category: 'servicio', isPaid: false },
];

const jul1: Expense[] = [
  { id: 'jul1-palacio',  name: 'Palacio',              amount: 180,   dueDay: 10, dueMonthLabel: 'Jul', isRecurring: false, person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 2540 },
  { id: 'jul1-merc-ali', name: 'Mercado Ali 4482',     amount: 905,   dueDay: 1,  dueMonthLabel: 'Jul', isRecurring: true,  person: 'Ali',        category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'jul1-sears',    name: 'Sears 3509 Didi Juan', amount: 0,                                        isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true, isAmountPending: true },
  { id: 'jul1-bbva',     name: 'BBVA 9091',            amount: 591,   dueDay: 12, dueMonthLabel: 'Jul', isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'jul1-dp-ali',   name: 'Didi Préstamo Ali',    amount: 2642,                                     isRecurring: true,  person: 'Ali',        category: 'prestamo', isPaid: false },
  { id: 'jul1-dp-juan',  name: 'Didi Préstamo Juan',   amount: 1646,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'jul1-story',    name: 'Juan Story Préstamo',  amount: 1383,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'jul1-ferreira', name: 'Ser Ferreira',         amount: 2800,                                     isRecurring: true,  person: 'Compartido', category: 'servicio', isPaid: false },
  { id: 'jul1-didi-juan',name: 'Didi Juan (Tarjeta)',  amount: 2441,  dueDay: 11, dueMonthLabel: 'Jul', isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 6305, notes: 'Resta $6,305' },
  { id: 'jul1-klar',     name: 'Klar',                 amount: 7300,                                     isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 21500 },
  { id: 'jul1-azteca',   name: 'Azteca',               amount: 4250,                                     isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false },
  { id: 'jul1-mercado',  name: 'Mercado',              amount: 3000,                                     isRecurring: true,  person: 'Compartido', category: 'mercado',  isPaid: false },
  { id: 'jul1-kids',     name: 'Kids',                 amount: 1000,                                     isRecurring: true,  person: 'Compartido', category: 'kids',     isPaid: false },
];

const jul15: Expense[] = [
  { id: 'jul15-plata',      name: 'Plata (extra)',       amount: 300,   dueDay: 18, dueMonthLabel: 'Jul', isRecurring: false, person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 2500 },
  { id: 'jul15-dp-ali',     name: 'Didi Préstamo Ali',  amount: 2642,                                     isRecurring: true,  person: 'Ali',        category: 'prestamo', isPaid: false },
  { id: 'jul15-dp-juan',    name: 'Didi Préstamo Juan', amount: 1646,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'jul15-story',      name: 'Juan Story Préstamo',amount: 1383,                                     isRecurring: true,  person: 'Juan',       category: 'prestamo', isPaid: false },
  { id: 'jul15-nu-juan',    name: 'Nu Juan',            amount: 1410,                                     isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'jul15-story-card', name: 'Story',              amount: 1170,  dueDay: 17, dueMonthLabel: 'Jul', isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'jul15-uala',       name: 'Uala (Walmart)',     amount: 2912,  dueDay: 15, dueMonthLabel: 'Jul', isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'jul15-casa',       name: 'Casa',               amount: 13000,                                    isRecurring: true,  person: 'Compartido', category: 'vivienda', isPaid: false },
  { id: 'jul15-plata-ali',  name: 'Plata Ali',          amount: 200,   dueDay: 24, dueMonthLabel: 'Jul', isRecurring: true,  person: 'Ali',        category: 'tarjeta',  isPaid: false, isCreditCard: true, totalDebt: 1874, notes: 'Pago mínimo' },
  { id: 'jul15-plata-juan', name: 'Plata Juan',         amount: 1407,  dueDay: 15, dueMonthLabel: 'Jul', isRecurring: true,  person: 'Juan',       category: 'tarjeta',  isPaid: false, isCreditCard: true },
  { id: 'jul15-uvm',        name: 'Pily UVM',           amount: 3700,                                     isRecurring: true,  person: 'Compartido', category: 'educacion',isPaid: false },
  { id: 'jul15-merc-kids',  name: 'Mercado + Kids',     amount: 4000,                                     isRecurring: true,  person: 'Compartido', category: 'mercado',  isPaid: false },
  { id: 'jul15-azteca',     name: 'Azteca',             amount: 4250,                                     isRecurring: true,  person: 'Compartido', category: 'tarjeta',  isPaid: false },
  { id: 'jul15-sra-mari',   name: 'Sra. Marí',          amount: 2400,                                     isRecurring: true,  person: 'Compartido', category: 'servicio', isPaid: false },
];

export const initialPeriods: BudgetPeriod[] = [
  { id: '2026-06-01', label: '1 Junio 2026',  shortLabel: '1 Jun',  day: 1,  month: 6, year: 2026, expenses: jun1  },
  { id: '2026-06-15', label: '15 Junio 2026', shortLabel: '15 Jun', day: 15, month: 6, year: 2026, expenses: jun15 },
  { id: '2026-07-01', label: '1 Julio 2026',  shortLabel: '1 Jul',  day: 1,  month: 7, year: 2026, expenses: jul1  },
  { id: '2026-07-15', label: '15 Julio 2026', shortLabel: '15 Jul', day: 15, month: 7, year: 2026, expenses: jul15 },
];
