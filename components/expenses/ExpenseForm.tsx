'use client';

import { useState, useEffect } from 'react';
import { Expense, ExpenseInput, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { getTodayString } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseInput) => void;
  expense?: Expense | null;
}

interface FormErrors {
  amount?: string;
  category?: string;
  description?: string;
  date?: string;
}

const EMPTY_FORM = {
  amount: '',
  category: '' as Category | '',
  description: '',
  date: getTodayString(),
};

export function ExpenseForm({ open, onClose, onSubmit, expense }: ExpenseFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (expense) {
        setForm({
          amount: expense.amount.toString(),
          category: expense.category,
          description: expense.description,
          date: expense.date,
        });
      } else {
        setForm({ ...EMPTY_FORM, date: getTodayString() });
      }
      setErrors({});
    }
  }, [open, expense]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      errs.amount = 'Enter a valid amount greater than $0';
    } else if (amount > 1_000_000) {
      errs.amount = 'Amount cannot exceed $1,000,000';
    }
    if (!form.category) errs.category = 'Select a category';
    if (!form.description.trim()) {
      errs.description = 'Description is required';
    } else if (form.description.trim().length > 100) {
      errs.description = 'Description must be under 100 characters';
    }
    if (!form.date) errs.date = 'Select a date';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 150));
    onSubmit({
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      category: form.category as Category,
      description: form.description.trim(),
      date: form.date,
    });
    setSubmitting(false);
    onClose();
  }

  function field(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'Edit Expense' : 'Add Expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => field('amount', e.target.value)}
              className={`w-full rounded-xl border py-2.5 pl-8 pr-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 ${
                errors.amount
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => field('category', e.target.value)}
            className={`w-full rounded-xl border py-2.5 pl-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 appearance-none bg-no-repeat ${
              errors.category
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs text-red-500">{errors.category}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <input
            type="text"
            placeholder="What did you spend on?"
            value={form.description}
            maxLength={100}
            onChange={(e) => field('description', e.target.value)}
            className={`w-full rounded-xl border py-2.5 px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 ${
              errors.description
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-slate-400">{form.description.length}/100</p>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            max={getTodayString()}
            onChange={(e) => field('date', e.target.value)}
            className={`w-full rounded-xl border py-2.5 px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 ${
              errors.date
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-500">{errors.date}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
