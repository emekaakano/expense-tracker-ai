'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useExpenseContext } from '@/context/ExpenseContext';
import { Header } from '@/components/layout/Header';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Expense, ExpenseInput } from '@/lib/types';
import { exportToCSV, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function ExpensesPage() {
  const { filteredExpenses, filters, addExpense, updateExpense, deleteExpense, setFilters, resetFilters } =
    useExpenseContext();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);

  function handleAdd(data: ExpenseInput) {
    addExpense(data);
  }

  function handleEdit(data: ExpenseInput) {
    if (editTarget) updateExpense(editTarget.id, data);
    setEditTarget(null);
  }

  function openEdit(expense: Expense) {
    setEditTarget(expense);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
  }

  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Header
            title="Expenses"
            subtitle="Manage and review all your transactions"
            action={{ label: 'Add Expense', onClick: () => setFormOpen(true) }}
          />
        </div>

        {/* Filter Panel */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <ExpenseFilters
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            resultCount={filteredExpenses.length}
          />
        </div>

        {/* List + toolbar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total:{' '}
              <span className="font-semibold text-slate-900">
                {formatCurrency(total)}
              </span>
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportToCSV(filteredExpenses)}
              disabled={filteredExpenses.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>

          <ExpenseList
            expenses={filteredExpenses}
            onEdit={openEdit}
            onDelete={deleteExpense}
          />
        </div>
      </div>

      <ExpenseForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editTarget ? handleEdit : handleAdd}
        expense={editTarget}
      />
    </>
  );
}
