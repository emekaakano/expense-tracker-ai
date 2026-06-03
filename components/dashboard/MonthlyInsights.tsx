'use client';

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  UtensilsCrossed,
  Car,
  Film,
  ShoppingBag,
  FileText,
  Package,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import { Expense, Category } from '@/lib/types';
import { getCategoryTotals, formatCurrency, getMonthBounds } from '@/lib/utils';
import { CATEGORY_COLORS, BUDGET_STREAK_DAYS } from '@/lib/constants';

const CATEGORY_LUCIDE: Record<Category, LucideIcon> = {
  Food: UtensilsCrossed,
  Transportation: Car,
  Entertainment: Film,
  Shopping: ShoppingBag,
  Bills: FileText,
  Other: Package,
};

interface MonthlyInsightsProps {
  expenses: Expense[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-slate-500">{payload[0].name}</p>
        <p className="text-sm font-bold text-slate-900">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function MonthlyInsights({ expenses }: MonthlyInsightsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { monthLabel, data, top3, totalThisMonth } = useMemo(() => {
    const { start, end, label } = getMonthBounds(0);
    const thisMonth = expenses.filter((e) => e.date >= start && e.date <= end);
    const totals = getCategoryTotals(thisMonth);
    return {
      monthLabel: label,
      data: totals.map((d) => ({ name: d.category, value: d.total })),
      top3: totals.slice(0, 3),
      totalThisMonth: thisMonth.reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Donut Chart */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:col-span-3">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Spending by Category · {monthLabel}
        </h2>
        <div className="relative h-72">
          {!mounted ? (
            <div className="h-full animate-pulse rounded-xl bg-slate-50" />
          ) : data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <p className="text-sm">No expenses this month</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name as Category]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Spending
                </p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">
                  {formatCurrency(totalThisMonth)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right column: Top 3 + Streak */}
      <div className="space-y-6 lg:col-span-2">
        {/* Top 3 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Top Categories</h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
              Top 3
            </span>
          </div>
          {top3.length === 0 ? (
            <p className="text-sm text-slate-400">No expenses this month</p>
          ) : (
            <ul className="space-y-3">
              {top3.map((c) => {
                const Icon = CATEGORY_LUCIDE[c.category];
                const color = CATEGORY_COLORS[c.category];
                return (
                  <li
                    key={c.category}
                    className="flex items-center gap-3 border-l-4 pl-3"
                    style={{ borderColor: color }}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}1a` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {c.category}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.count} {c.count === 1 ? 'transaction' : 'transactions'}
                      </p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-bold text-slate-900">
                      {formatCurrency(c.total)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Budget Streak — dashed border echoes the napkin sketch */}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Budget Streak</p>
              <p className="mt-0.5 text-xs text-slate-500">Days on track this month</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Flame className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums text-emerald-600">
              {BUDGET_STREAK_DAYS}
            </span>
            <span className="text-sm font-medium text-slate-500">days!</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, (BUDGET_STREAK_DAYS / 30) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
