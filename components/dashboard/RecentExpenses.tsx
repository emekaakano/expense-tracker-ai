'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Expense } from '@/lib/types';
import { CategoryBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const recent = expenses.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-400">
        <p className="text-sm">No expenses yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-50">
        {recent.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {expense.description}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{formatDate(expense.date)}</p>
            </div>
            <CategoryBadge category={expense.category} showIcon={false} />
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
              {formatCurrency(expense.amount)}
            </span>
          </div>
        ))}
      </div>

      {expenses.length > 5 && (
        <Link
          href="/expenses"
          className="mt-4 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
        >
          View all {expenses.length} expenses
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
