'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, TrendingDown, Home, GraduationCap,
  ShoppingCart, Baby, Wrench, Package,
  CheckCircle2, Circle, RefreshCw, Calendar,
  ChevronDown, ChevronUp, Plus, X, Wallet,
} from 'lucide-react';
import type { BudgetPeriod, Expense, Person, Category, FilterPerson } from './types';
import { initialPeriods, BIWEEKLY_BUDGET } from './data';

const STORAGE_KEY = 'expense-tracker-v1';

const MONTH_NUM: Record<string, number> = {
  Ene: 1, Feb: 2, Mar: 3, Abr: 4, May: 5, Jun: 6,
  Jul: 7, Ago: 8, Sep: 9, Oct: 10, Nov: 11, Dic: 12,
};

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  vivienda:   { icon: Home,           label: 'Vivienda',           color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  prestamo:   { icon: TrendingDown,   label: 'Préstamos',          color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  tarjeta:    { icon: CreditCard,     label: 'Tarjetas de Crédito',color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  servicio:   { icon: Wrench,         label: 'Servicios',          color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  educacion:  { icon: GraduationCap,  label: 'Educación',          color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  mercado:    { icon: ShoppingCart,   label: 'Mercado',            color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  kids:       { icon: Baby,           label: 'Kids',               color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20' },
  otro:       { icon: Package,        label: 'Otros',              color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20' },
};

const PERSON_STYLE: Record<Person, string> = {
  Ali:        'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  Juan:       'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  Compartido: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const CATEGORY_ORDER: Category[] = ['vivienda', 'prestamo', 'tarjeta', 'servicio', 'educacion', 'mercado', 'kids', 'otro'];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);

function getDueUrgency(dueDay: number, dueMonthLabel: string, year: number) {
  const today = new Date();
  const monthNum = MONTH_NUM[dueMonthLabel] ?? today.getMonth() + 1;
  const due = new Date(year, monthNum - 1, dueDay);
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return 'overdue' as const;
  if (diff <= 3) return 'urgent'  as const;
  if (diff <= 7) return 'warning' as const;
  return 'ok' as const;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const BLANK_FORM = {
  name: '',
  amount: '',
  totalDebt: '',
  category: 'tarjeta' as Category,
  person: 'Compartido' as Person,
  isRecurring: false,
  isCreditCard: false,
  dueDay: '',
  dueMonthLabel: '',
  notes: '',
};

export default function ExpenseTracker() {
  const [periods, setPeriods] = useState<BudgetPeriod[]>(initialPeriods);
  const [activePeriodId, setActivePeriodId] = useState(initialPeriods[0].id);
  const [filterPerson, setFilterPerson] = useState<FilterPerson>('Todos');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { periods: saved, activePeriodId: savedId } = JSON.parse(raw);
        if (saved) setPeriods(saved);
        if (savedId) setActivePeriodId(savedId);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ periods, activePeriodId }));
  }, [periods, activePeriodId, hydrated]);

  const period = periods.find(p => p.id === activePeriodId) ?? periods[0];

  const togglePaid = useCallback((expenseId: string) => {
    setPeriods(prev =>
      prev.map(p =>
        p.id === activePeriodId
          ? { ...p, expenses: p.expenses.map(e => e.id === expenseId ? { ...e, isPaid: !e.isPaid } : e) }
          : p
      )
    );
  }, [activePeriodId]);

  const addExpense = useCallback(() => {
    if (!form.name.trim() || !form.amount) return;
    const newExp: Expense = {
      id: uid(),
      name: form.name.trim(),
      amount: parseFloat(form.amount) || 0,
      totalDebt: form.totalDebt ? parseFloat(form.totalDebt) : undefined,
      category: form.category,
      person: form.person,
      isRecurring: form.isRecurring,
      isCreditCard: form.isCreditCard,
      isPaid: false,
      dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
      dueMonthLabel: form.dueMonthLabel || undefined,
      notes: form.notes.trim() || undefined,
    };
    setPeriods(prev =>
      prev.map(p =>
        p.id === activePeriodId
          ? { ...p, expenses: [...p.expenses, newExp] }
          : p
      )
    );
    setForm(BLANK_FORM);
    setShowForm(false);
  }, [form, activePeriodId]);

  const deleteExpense = useCallback((expenseId: string) => {
    setPeriods(prev =>
      prev.map(p =>
        p.id === activePeriodId
          ? { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) }
          : p
      )
    );
  }, [activePeriodId]);

  const toggleCategory = (cat: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const filtered = period.expenses.filter(e =>
    filterPerson === 'Todos' || e.person === filterPerson
  );

  const grouped = filtered.reduce<Partial<Record<Category, Expense[]>>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category]!.push(e);
    return acc;
  }, {});

  const totalKnown = period.expenses.filter(e => !e.isAmountPending).reduce((s, e) => s + e.amount, 0);
  const paidAmount  = period.expenses.filter(e => e.isPaid).reduce((s, e) => s + e.amount, 0);
  const pendingAmt  = totalKnown - paidAmount;
  const remaining   = BIWEEKLY_BUDGET - totalKnown;
  const overBudget  = remaining < 0;
  const pct         = Math.min((totalKnown / BIWEEKLY_BUDGET) * 100, 100);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF8000] to-amber-300">
              Control de Gastos
            </h1>
            <p className="text-[11px] text-gray-500">Presupuesto quincenal · {fmt(BIWEEKLY_BUDGET)}</p>
          </div>
          <div className={`text-right text-sm font-semibold ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>
            {overBudget ? '⚠ Excedido' : '✓ Dentro'}
            <p className="text-[11px] font-normal">
              {overBudget ? `+${fmt(Math.abs(remaining))}` : `${fmt(remaining)} libre`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24">

        {/* Period tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePeriodId(p.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activePeriodId === p.id
                  ? 'bg-[#FF8000] text-black font-bold shadow-lg shadow-orange-500/30'
                  : 'bg-white/8 text-gray-400 hover:bg-white/15 border border-white/10'
              }`}
            >
              {p.shortLabel}
            </button>
          ))}
        </div>

        {/* Budget summary */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Total gastos</p>
              <p className={`text-base font-bold ${overBudget ? 'text-red-400' : 'text-white'}`}>{fmt(totalKnown)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Pagado</p>
              <p className="text-base font-bold text-emerald-400">{fmt(paidAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Pendiente</p>
              <p className="text-base font-bold text-amber-400">{fmt(pendingAmt)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              {/* Paid portion */}
              <div className="h-full flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min((paidAmount / BIWEEKLY_BUDGET) * 100, 100)}%` }}
                />
                <div
                  className={`h-full transition-all ${overBudget ? 'bg-red-500' : 'bg-[#FF8000]/70'}`}
                  style={{ width: `${Math.min(((totalKnown - paidAmount) / BIWEEKLY_BUDGET) * 100, 100 - (paidAmount / BIWEEKLY_BUDGET) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>{Math.round(pct)}% del presupuesto</span>
              <span className={overBudget ? 'text-red-400' : 'text-emerald-400'}>
                {overBudget ? `Excedente ${fmt(Math.abs(remaining))}` : `Disponible ${fmt(remaining)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Person filter */}
        <div className="flex gap-2">
          {(['Todos', 'Ali', 'Juan', 'Compartido'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPerson(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filterPerson === p
                  ? 'bg-[#FF8000] text-black border-[#FF8000] font-bold'
                  : 'bg-transparent text-gray-400 border-white/15 hover:border-white/30'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Expense groups */}
        {CATEGORY_ORDER.map(cat => {
          const items = grouped[cat];
          if (!items?.length) return null;
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          const isCollapsed = collapsed.has(cat);
          const catTotal = items.reduce((s, e) => s + (e.isAmountPending ? 0 : e.amount), 0);
          const catPaid  = items.filter(e => e.isPaid).reduce((s, e) => s + e.amount, 0);
          const allPaid  = items.every(e => e.isPaid);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <span className={`text-sm font-semibold ${allPaid ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-600">({items.length})</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{fmt(catTotal)}</p>
                    {catPaid > 0 && catPaid < catTotal && (
                      <p className="text-[11px] text-emerald-400">{fmt(catPaid)} pag.</p>
                    )}
                  </div>
                  {isCollapsed
                    ? <ChevronDown className="w-4 h-4 text-gray-600" />
                    : <ChevronUp className="w-4 h-4 text-gray-600" />
                  }
                </div>
              </button>

              {!isCollapsed && (
                <div className="space-y-2 mt-1">
                  {items.map(exp => {
                    const urgency = exp.dueDay && exp.dueMonthLabel
                      ? getDueUrgency(exp.dueDay, exp.dueMonthLabel, period.year)
                      : null;

                    const borderClass = exp.isPaid
                      ? 'border-emerald-500/20'
                      : urgency === 'overdue' ? 'border-red-500/60'
                      : urgency === 'urgent'  ? 'border-orange-500/60'
                      : urgency === 'warning' ? 'border-amber-500/40'
                      : 'border-white/8';

                    const dueLabelClass = urgency === 'overdue' ? 'text-red-400'
                      : urgency === 'urgent'  ? 'text-orange-400'
                      : urgency === 'warning' ? 'text-amber-400'
                      : 'text-gray-600';

                    return (
                      <div
                        key={exp.id}
                        className={`bg-white/4 rounded-xl border p-3 transition-all group ${borderClass} ${exp.isPaid ? 'opacity-55' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => togglePaid(exp.id)}
                            className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
                            aria-label={exp.isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                          >
                            {exp.isPaid
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              : <Circle className="w-5 h-5 text-gray-600 hover:text-gray-400 transition-colors" />
                            }
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-sm font-medium truncate ${exp.isPaid ? 'line-through text-gray-500' : 'text-white'}`}>
                                    {exp.name}
                                  </span>
                                  {exp.isRecurring && (
                                    <RefreshCw className="w-3 h-3 text-gray-600 flex-shrink-0" title="Recurrente" />
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PERSON_STYLE[exp.person]}`}>
                                    {exp.person}
                                  </span>
                                  {exp.isAmountPending && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                      Monto por definir
                                    </span>
                                  )}
                                  {exp.notes && (
                                    <span className="text-[11px] text-gray-600">{exp.notes}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-2 flex-shrink-0">
                                <div className="text-right">
                                  <p className={`text-sm font-bold ${exp.isPaid ? 'text-gray-500' : 'text-white'}`}>
                                    {exp.isAmountPending ? '—' : fmt(exp.amount)}
                                  </p>
                                  {exp.totalDebt && (
                                    <p className="text-[11px] text-gray-600">Deuda: {fmt(exp.totalDebt)}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteExpense(exp.id)}
                                  className="opacity-0 group-hover:opacity-100 mt-0.5 text-gray-700 hover:text-red-400 transition-all"
                                  aria-label="Eliminar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {exp.dueDay && exp.dueMonthLabel && (
                              <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-medium ${dueLabelClass}`}>
                                <Calendar className="w-3 h-3" />
                                <span>Vence {exp.dueDay} {exp.dueMonthLabel}</span>
                                {urgency === 'overdue' && <span className="font-bold">· VENCIDO</span>}
                                {urgency === 'urgent'  && <span className="font-bold">· URGENTE</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay gastos para este período</p>
          </div>
        )}
      </div>

      {/* FAB — Add expense */}
      <div className="fixed bottom-6 right-4 z-50">
        <button
          onClick={() => setShowForm(true)}
          className="w-14 h-14 rounded-full bg-[#FF8000] text-black shadow-xl shadow-orange-500/40 flex items-center justify-center hover:bg-orange-500 transition-all active:scale-95"
          aria-label="Agregar gasto"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Add expense drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#161616] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Agregar gasto</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del gasto *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF8000]/60"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Monto a pagar *"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF8000]/60"
                />
                <input
                  type="number"
                  placeholder="Deuda total"
                  value={form.totalDebt}
                  onChange={e => setForm(f => ({ ...f, totalDebt: e.target.value }))}
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF8000]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF8000]/60"
                >
                  {CATEGORY_ORDER.map(c => (
                    <option key={c} value={c} className="bg-[#1a1a1a]">
                      {CATEGORY_CONFIG[c].label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.person}
                  onChange={e => setForm(f => ({ ...f, person: e.target.value as Person }))}
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF8000]/60"
                >
                  {(['Ali', 'Juan', 'Compartido'] as Person[]).map(p => (
                    <option key={p} value={p} className="bg-[#1a1a1a]">{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Día de vencimiento"
                  value={form.dueDay}
                  min={1}
                  max={31}
                  onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF8000]/60"
                />
                <select
                  value={form.dueMonthLabel}
                  onChange={e => setForm(f => ({ ...f, dueMonthLabel: e.target.value }))}
                  className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF8000]/60"
                >
                  <option value="" className="bg-[#1a1a1a]">Mes venc.</option>
                  {MONTHS_ES.map(m => (
                    <option key={m} value={m} className="bg-[#1a1a1a]">{m}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Notas (opcional)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF8000]/60"
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> Recurrente
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isCreditCard}
                    onChange={e => setForm(f => ({ ...f, isCreditCard: e.target.checked }))}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Tarjeta
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={addExpense}
              disabled={!form.name.trim() || !form.amount}
              className="w-full py-3.5 rounded-xl bg-[#FF8000] text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors active:scale-98"
            >
              Agregar gasto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
