'use client';

import { useState } from 'react';
import { useExpenseContext } from '@/context/ExpenseContext';
import { Header } from '@/components/layout/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExpenseInput } from '@/lib/types';
import { exportToCSV } from '@/lib/utils';

export default function DashboardPage() {
  const { expenses, addExpense } = useExpenseContext();
  const [formOpen, setFormOpen] = useState(false);

  function handleAdd(data: ExpenseInput) {
    addExpense(data);
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Dashboard"
          subtitle="Your financial overview at a glance"
          action={{ label: 'Add Expense', onClick: () => setFormOpen(true) }}
          secondaryAction={{ label: 'Export Data', onClick: () => exportToCSV(expenses) }}
        />

        <SummaryCards expenses={expenses} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Monthly Trend — wider */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:col-span-3">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Monthly Spending Trend
            </h2>
            <MonthlyChart expenses={expenses} />
          </div>

          {/* Category Breakdown */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              This Month by Category
            </h2>
            <CategoryChart expenses={expenses} />
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent Expenses</h2>
          <RecentExpenses expenses={expenses} />
        </div>
      </div>

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAdd}
      />
    </>
  );
}
