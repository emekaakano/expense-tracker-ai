'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Hash } from 'lucide-react';
import { Expense } from '@/lib/types';
import { formatCurrency, getMonthBounds, getCategoryTotals } from '@/lib/utils';
import { CATEGORY_ICONS } from '@/lib/constants';

interface SummaryCardsProps {
  expenses: Expense[];
}

export function SummaryCards({ expenses }: SummaryCardsProps) {
  const stats = useMemo(() => {
    const { start: monthStart, end: monthEnd } = getMonthBounds(0);
    const { start: lastMonthStart, end: lastMonthEnd } = getMonthBounds(-1);

    const thisMonth = expenses.filter((e) => e.date >= monthStart && e.date <= monthEnd);
    const lastMonth = expenses.filter(
      (e) => e.date >= lastMonthStart && e.date <= lastMonthEnd
    );

    const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalThis = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const totalLast = lastMonth.reduce((sum, e) => sum + e.amount, 0);

    const monthChange =
      totalLast > 0 ? ((totalThis - totalLast) / totalLast) * 100 : null;

    const categoryTotals = getCategoryTotals(thisMonth);
    const topCategory = categoryTotals[0];

    return {
      totalAll,
      totalThis,
      totalLast,
      monthChange,
      topCategory,
      count: expenses.length,
      thisMonthCount: thisMonth.length,
    };
  }, [expenses]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Spent"
        value={formatCurrency(stats.totalAll)}
        sub={`${stats.count} transactions`}
        icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
        iconBg="bg-violet-50"
      />
      <StatCard
        label="This Month"
        value={formatCurrency(stats.totalThis)}
        sub={
          stats.monthChange !== null
            ? `${stats.monthChange >= 0 ? '+' : ''}${stats.monthChange.toFixed(1)}% vs last month`
            : `${stats.thisMonthCount} transactions`
        }
        subColor={
          stats.monthChange !== null && stats.monthChange > 0
            ? 'text-red-500'
            : stats.monthChange !== null
            ? 'text-emerald-600'
            : undefined
        }
        icon={<Calendar className="h-5 w-5 text-blue-600" />}
        iconBg="bg-blue-50"
      />
      <StatCard
        label="Top Category"
        value={stats.topCategory ? stats.topCategory.category : '—'}
        sub={
          stats.topCategory
            ? `${formatCurrency(stats.topCategory.total)} this month`
            : 'No data this month'
        }
        icon={
          <span className="text-lg leading-none">
            {stats.topCategory ? CATEGORY_ICONS[stats.topCategory.category] : '📊'}
          </span>
        }
        iconBg="bg-amber-50"
      />
      <StatCard
        label="Last Month"
        value={formatCurrency(stats.totalLast)}
        sub="Previous month total"
        icon={<TrendingDown className="h-5 w-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ label, value, sub, subColor, icon, iconBg }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${iconBg}`}>{icon}</div>
      </div>
      <p className={`mt-3 text-xs font-medium ${subColor ?? 'text-slate-400'}`}>{sub}</p>
    </div>
  );
}
