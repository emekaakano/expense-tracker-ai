'use client';

import { useExpenseContext } from '@/context/ExpenseContext';
import { MonthlyInsights } from '@/components/dashboard/MonthlyInsights';

export default function InsightsPage() {
  const { expenses } = useExpenseContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Monthly Insights</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Where your money went this month, at a glance
        </p>
      </div>

      <MonthlyInsights expenses={expenses} />
    </div>
  );
}
