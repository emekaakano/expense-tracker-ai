'use client';

import { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useExpenseContext } from '@/context/ExpenseContext';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ExportDialog } from '@/components/export/ExportDialog';
import { Button } from '@/components/ui/Button';
import { ExpenseInput } from '@/lib/types';

export default function DashboardPage() {
  const { expenses, addExpense } = useExpenseContext();
  const [formOpen, setFormOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  function handleAdd(data: ExpenseInput) {
    addExpense(data);
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Your financial overview at a glance
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setExportOpen(true)}
              disabled={expenses.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

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

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        expenses={expenses}
      />
    </>
  );
}
