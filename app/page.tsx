'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Home, CreditCard, Briefcase, Wrench, BookOpen,
  ShoppingCart, Baby, HelpCircle, Plus, X, Check,
  ChevronDown, ChevronRight, Trash2, AlertCircle,
  Clock, Calendar, DollarSign
} from 'lucide-react';
import type { BudgetPeriod, Expense, FilterPerson, Category, Person } from './types';
import { initialPeriods, BIWEEKLY_BUDGET } from './data';

const STORAGE_KEY = 'pagos-tracker-v1';

const MONTH_NUM: Record<string, number> = {
  Ene: 1, Feb: 2, Mar: 3, Abr: 4, May: 5, Jun: 6,
  Jul: 7, Ago: 8, Sep: 9, Oct: 10, Nov: 11, Dic: 12,
};

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  vivienda:  { label: 'Vivienda',   icon: <Home size={14} />,        color: '#60a5fa' },
  prestamo:  { label: 'Préstamos',  icon: <DollarSign size={14} />,  color: '#f472b6' },
  tarjeta:   { label: 'Tarjetas',   icon: <CreditCard size={14} />,  color: '#a78bfa' },
  servicio:  { label: 'Servicios',  icon: <Wrench size={14} />,      color: '#34d399' },
  educacion: { label: 'Educación',  icon: <BookOpen size={14} />,    color: '#fbbf24' },
  mercado:   { label: 'Mercado',    icon: <ShoppingCart size={14} />,color: '#fb923c' },
  kids:      { label: 'Kids',       icon: <Baby size={14} />,        color: '#f9a8d4' },
  otro:      { label: 'Otro',       icon: <HelpCircle size={14} />,  color: '#94a3b8' },
};

const CATEGORY_ORDER: Category[] = [
  'vivienda', 'prestamo', 'tarjeta', 'servicio', 'educacion', 'mercado', 'kids', 'otro',
];

const PERSON_COLORS: Record<string, string> = {
  Ali:        '#FF8000',
  Juan:       '#60a5fa',
  Compartido: '#34d399',
};

function getDueUrgency(dueDay?: number, dueMonthLabel?: string): 'overdue' | 'urgent' | 'warning' | 'ok' | null {
  if (!dueDay || !dueMonthLabel) return null;
  const today = new Date();
  const monthNum = MONTH_NUM[dueMonthLabel];
  if (!monthNum) return null;
  const year = today.getFullYear();
  const dueDate = new Date(year, monthNum - 1, dueDay);
  const diff = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return 'overdue';
  if (diff <= 3) return 'urgent';
  if (diff <= 7) return 'warning';
  return 'ok';
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

interface AddExpenseForm {
  name: string;
  amount: string;
  category: Category;
  person: Person;
  isRecurring: boolean;
  isCreditCard: boolean;
  dueDay: string;
  dueMonthLabel: string;
  notes: string;
}

const EMPTY_FORM: AddExpenseForm = {
  name: '', amount: '', category: 'otro', person: 'Compartido',
  isRecurring: false, isCreditCard: false, dueDay: '', dueMonthLabel: '', notes: '',
};

export default function PagosPage() {
  const [periods, setPeriods] = useState<BudgetPeriod[]>(initialPeriods);
  const [activePeriodId, setActivePeriodId] = useState(initialPeriods[0].id);
  const [filterPerson, setFilterPerson] = useState<FilterPerson>('Todos');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [form, setForm] = useState<AddExpenseForm>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPeriods(JSON.parse(saved) as BudgetPeriod[]);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(periods));
  }, [periods, hydrated]);

  useEffect(() => {
    if (!showAddDrawer) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setShowAddDrawer(false);
        setForm(EMPTY_FORM);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddDrawer]);

  const activePeriod = periods.find(p => p.id === activePeriodId)!;

  const visibleExpenses = filterPerson === 'Todos'
    ? activePeriod.expenses
    : activePeriod.expenses.filter(e => e.person === filterPerson || e.person === 'Compartido');

  const totalAmount = visibleExpenses.filter(e => !e.isAmountPending).reduce((s, e) => s + e.amount, 0);
  const paidAmount = visibleExpenses.filter(e => e.isPaid && !e.isAmountPending).reduce((s, e) => s + e.amount, 0);
  const remaining = BIWEEKLY_BUDGET - totalAmount;
  const progress = Math.min(100, Math.round((totalAmount / BIWEEKLY_BUDGET) * 100));

  function togglePaid(expenseId: string) {
    setPeriods(prev => prev.map(p =>
      p.id !== activePeriodId ? p : {
        ...p,
        expenses: p.expenses.map(e =>
          e.id === expenseId ? { ...e, isPaid: !e.isPaid } : e
        ),
      }
    ));
  }

  function deleteExpense(expenseId: string) {
    setPeriods(prev => prev.map(p =>
      p.id !== activePeriodId ? p : {
        ...p,
        expenses: p.expenses.filter(e => e.id !== expenseId),
      }
    ));
  }

  function toggleGroup(key: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleAddExpense() {
    if (!form.name.trim() || !form.amount) return;
    const amount = parseFloat(form.amount.replace(/,/g, ''));
    if (isNaN(amount)) return;
    const newExpense: Expense = {
      id: `custom-${Date.now()}`,
      name: form.name.trim(),
      amount,
      category: form.category,
      person: form.person,
      isRecurring: form.isRecurring,
      isCreditCard: form.isCreditCard,
      isPaid: false,
      dueDay: form.dueDay ? parseInt(form.dueDay) : undefined,
      dueMonthLabel: form.dueMonthLabel || undefined,
      notes: form.notes || undefined,
    };
    setPeriods(prev => prev.map(p =>
      p.id !== activePeriodId ? p : { ...p, expenses: [...p.expenses, newExpense] }
    ));
    setForm(EMPTY_FORM);
    setShowAddDrawer(false);
  }

  function resetData() {
    if (!confirm('¿Restablecer todos los datos al estado inicial?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setPeriods(initialPeriods);
  }

  const grouped = CATEGORY_ORDER.reduce<Record<Category, Expense[]>>((acc, cat) => {
    acc[cat] = visibleExpenses.filter(e => e.category === cat);
    return acc;
  }, {} as Record<Category, Expense[]>);

  const urgencyStyle = {
    overdue: 'border-red-500 bg-red-500/10',
    urgent:  'border-orange-500 bg-orange-500/10',
    warning: 'border-yellow-500 bg-yellow-500/5',
    ok:      '',
  };

  const urgencyDot = {
    overdue: <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 shrink-0" />,
    urgent:  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5 shrink-0" />,
    warning: <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5 shrink-0" />,
    ok:      null,
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white max-w-2xl mx-auto px-4 pb-24">
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Control de Pagos</h1>
          <p className="text-xs text-white/40 mt-0.5">Quincena · {fmt(BIWEEKLY_BUDGET)}</p>
        </div>
        <button onClick={resetData} className="text-xs text-white/20 hover:text-white/50 transition-colors">
          reset
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePeriodId(p.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              p.id === activePeriodId
                ? 'bg-[#FF8000] text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {p.shortLabel}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-white/5 rounded-2xl p-4 border border-white/10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Total gastos</p>
            <p className="text-2xl font-bold mt-0.5">{fmt(totalAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider">Disponible</p>
            <p className={`text-lg font-semibold mt-0.5 ${remaining < 0 ? 'text-red-400' : 'text-[#34d399]'}`}>
              {fmt(remaining)}
            </p>
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-orange-500' : 'bg-[#FF8000]'
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-white/30">
          <span>Pagado {fmt(paidAmount)}</span>
          <span>{progress}% del presupuesto</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {(['Todos', 'Ali', 'Juan', 'Compartido'] as FilterPerson[]).map(p => (
          <button
            key={p}
            onClick={() => setFilterPerson(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterPerson === p
                ? 'text-white'
                : 'bg-white/5 text-white/40 hover:text-white/70'
            }`}
            style={filterPerson === p ? {
              backgroundColor: p === 'Todos' ? '#FF8000' : PERSON_COLORS[p] ?? '#FF8000',
            } : {}}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {CATEGORY_ORDER.map(cat => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          const cfg = CATEGORY_CONFIG[cat];
          const groupKey = `${activePeriodId}-${cat}`;
          const isCollapsed = collapsedGroups.has(groupKey);
          const groupTotal = items.filter(e => !e.isAmountPending).reduce((s, e) => s + e.amount, 0);
          const paidCount = items.filter(e => e.isPaid).length;

          return (
            <div key={cat} className="rounded-xl overflow-hidden border border-white/8">
              <button
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors"
                onClick={() => toggleGroup(groupKey)}
              >
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <span className="text-sm font-semibold text-white/80 flex-1 text-left">{cfg.label}</span>
                <span className="text-xs text-white/30">{paidCount}/{items.length}</span>
                <span className="text-xs text-white/50 font-medium">{fmt(groupTotal)}</span>
                <span className="text-white/30 ml-1">
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-white/5">
                  {items.map(expense => {
                    const urgency = getDueUrgency(expense.dueDay, expense.dueMonthLabel);
                    const isHovered = hoveredId === expense.id;

                    return (
                      <div
                        key={expense.id}
                        className={`flex items-center gap-3 px-4 py-3 transition-all border-l-2 ${
                          expense.isPaid
                            ? 'opacity-40 border-transparent'
                            : urgency && urgency !== 'ok'
                              ? `${urgencyStyle[urgency]} border-l-2`
                              : 'border-transparent hover:bg-white/3'
                        }`}
                        onMouseEnter={() => setHoveredId(expense.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <button
                          onClick={() => togglePaid(expense.id)}
                          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            expense.isPaid
                              ? 'bg-[#34d399] border-[#34d399]'
                              : 'border-white/20 hover:border-[#FF8000]'
                          }`}
                        >
                          {expense.isPaid && <Check size={10} strokeWidth={3} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {urgency && urgency !== 'ok' && !expense.isPaid && urgencyDot[urgency]}
                            <span className={`text-sm font-medium truncate ${expense.isPaid ? 'line-through text-white/30' : 'text-white/90'}`}>
                              {expense.name}
                            </span>
                            {expense.isCreditCard && (
                              <CreditCard size={10} className="shrink-0 text-white/20" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span
                              className="text-xs font-medium"
                              style={{ color: PERSON_COLORS[expense.person] ?? '#94a3b8' }}
                            >
                              {expense.person}
                            </span>
                            {expense.dueDay && expense.dueMonthLabel && (
                              <span className={`text-xs flex items-center gap-0.5 ${
                                urgency === 'overdue' ? 'text-red-400' :
                                urgency === 'urgent'  ? 'text-orange-400' :
                                urgency === 'warning' ? 'text-yellow-400' : 'text-white/30'
                              }`}>
                                <Calendar size={9} />
                                {expense.dueDay} {expense.dueMonthLabel}
                              </span>
                            )}
                            {expense.notes && (
                              <span className="text-xs text-white/25 italic truncate max-w-[120px]">{expense.notes}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {expense.isAmountPending ? (
                            <span className="text-xs text-white/30 italic">pendiente</span>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-white/90">{fmt(expense.amount)}</p>
                              {expense.totalDebt && (
                                <p className="text-xs text-white/25">/{fmt(expense.totalDebt)}</p>
                              )}
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all ${
                            isHovered ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowAddDrawer(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#FF8000] text-white shadow-lg shadow-orange-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus size={24} />
      </button>

      {showAddDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div
            ref={drawerRef}
            className="w-full max-w-2xl mx-auto bg-[#161616] rounded-t-3xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Agregar gasto</h2>
              <button onClick={() => { setShowAddDrawer(false); setForm(EMPTY_FORM); }}>
                <X size={20} className="text-white/50 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ej. Netflix"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF8000]/50"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Monto (MXN)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF8000]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Categoría</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF8000]/50"
                  >
                    {CATEGORY_ORDER.map(c => (
                      <option key={c} value={c} className="bg-[#161616]">{CATEGORY_CONFIG[c].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Persona</label>
                  <select
                    value={form.person}
                    onChange={e => setForm(f => ({ ...f, person: e.target.value as Person }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF8000]/50"
                  >
                    <option value="Ali" className="bg-[#161616]">Ali</option>
                    <option value="Juan" className="bg-[#161616]">Juan</option>
                    <option value="Compartido" className="bg-[#161616]">Compartido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Día de pago</label>
                  <input
                    type="number"
                    value={form.dueDay}
                    onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                    placeholder="ej. 15"
                    min={1} max={31}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF8000]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Mes</label>
                  <select
                    value={form.dueMonthLabel}
                    onChange={e => setForm(f => ({ ...f, dueMonthLabel: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF8000]/50"
                  >
                    <option value="" className="bg-[#161616]">—</option>
                    {Object.keys(MONTH_NUM).map(m => (
                      <option key={m} value={m} className="bg-[#161616]">{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Notas (opcional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="ej. Pago mínimo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF8000]/50"
                />
              </div>

              <div className="flex gap-4">
                {[
                  { key: 'isRecurring', label: 'Recurrente' },
                  { key: 'isCreditCard', label: 'Tarjeta crédito' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof AddExpenseForm] }))}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        form[key as keyof AddExpenseForm] ? 'bg-[#FF8000]' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form[key as keyof AddExpenseForm] ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                    <span className="text-xs text-white/50">{label}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleAddExpense}
                disabled={!form.name.trim() || !form.amount}
                className="w-full bg-[#FF8000] text-white font-semibold py-3 rounded-xl mt-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors"
              >
                Agregar gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
