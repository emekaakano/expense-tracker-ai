'use client';

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Expense } from '@/lib/types';
import { getCategoryTotals, formatCurrency, getMonthBounds } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants';

interface CategoryChartProps {
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

export function CategoryChart({ expenses }: CategoryChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const { start, end } = getMonthBounds(0);
    const thisMonth = expenses.filter((e) => e.date >= start && e.date <= end);
    return getCategoryTotals(thisMonth).map((d) => ({
      name: d.category,
      value: d.total,
      count: d.count,
    }));
  }, [expenses]);

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-50" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <p className="text-sm">No expenses this month</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-40 w-full sm:w-40 sm:flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={64}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        {data.map((d) => {
          const pct = ((d.value / total) * 100).toFixed(0);
          return (
            <div key={d.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 text-sm leading-none">
                  {CATEGORY_ICONS[d.name as keyof typeof CATEGORY_ICONS]}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                  {d.name}
                </span>
                <span className="flex-shrink-0 whitespace-nowrap text-xs font-semibold text-slate-900">
                  {formatCurrency(d.value)}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS],
                    }}
                  />
                </div>
                <span className="flex-shrink-0 text-[10px] tabular-nums text-slate-400">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
