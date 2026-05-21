'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Expense, Category } from '@/lib/types';
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/constants';
import { formatCurrency, formatDate, getTodayString } from '@/lib/utils';
import {
  ExportFormat,
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  runExport,
} from '@/lib/export';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
}

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
}[] = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Spreadsheet-ready, opens in Excel & Sheets',
    icon: FileSpreadsheet,
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Structured data for developers & APIs',
    icon: FileJson,
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Print-ready report with header & totals',
    icon: FileText,
  },
];

const PREVIEW_ROWS = 5;

function defaultFilename(): string {
  return `expenses-${getTodayString()}`;
}

export function ExportDialog({ open, onClose, expenses }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(CATEGORIES)
  );
  const [filename, setFilename] = useState(defaultFilename());
  const [exporting, setExporting] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormat('csv');
      setDateFrom('');
      setDateTo('');
      setSelectedCategories(new Set(CATEGORIES));
      setFilename(defaultFilename());
      setExporting(false);
      setCompletedAt(null);
      setError(null);
    }
  }, [open]);

  const dateRangeError = useMemo(() => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      return 'Start date must be before end date';
    }
    return null;
  }, [dateFrom, dateTo]);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (!selectedCategories.has(e.category)) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [expenses, dateFrom, dateTo, selectedCategories]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function toggleAllCategories() {
    setSelectedCategories((prev) =>
      prev.size === CATEGORIES.length ? new Set() : new Set(CATEGORIES)
    );
  }

  async function handleExport() {
    if (filtered.length === 0 || dateRangeError) return;
    setExporting(true);
    setError(null);
    try {
      const base = filename.trim() || defaultFilename();
      const sanitized = base.replace(/[\\/:*?"<>|]/g, '_');
      const ext = FORMAT_EXTENSIONS[format];
      const finalName = sanitized.toLowerCase().endsWith(`.${ext}`)
        ? sanitized
        : `${sanitized}.${ext}`;

      await new Promise((r) => setTimeout(r, 300));
      await runExport(format, filtered, finalName);

      setCompletedAt(Date.now());
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const allSelected = selectedCategories.size === CATEGORIES.length;
  const noneSelected = selectedCategories.size === 0;
  const canExport =
    !exporting && filtered.length > 0 && !dateRangeError && !noneSelected;

  return (
    <Modal open={open} onClose={onClose} title="Export Expenses" className="max-w-3xl">
      <div className="space-y-5">
        {/* Format picker */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Format
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = format === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={cn(
                    'group flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all',
                    active
                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-violet-600' : 'text-slate-400'
                      )}
                    />
                    {active && <Check className="h-4 w-4 text-violet-600" />}
                  </div>
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      active ? 'text-violet-900' : 'text-slate-900'
                    )}
                  >
                    {opt.label}
                  </div>
                  <p className="text-xs leading-snug text-slate-500">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filters */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date Range
            </h3>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">To</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              {dateRangeError && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {dateRangeError}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categories
              </h3>
              <button
                type="button"
                onClick={toggleAllCategories}
                className="text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => {
                const checked = selectedCategories.has(cat);
                return (
                  <label
                    key={cat}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                      checked
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <span className="truncate text-slate-700">{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filename */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filename
          </h3>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 hover:border-slate-300">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={defaultFilename()}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
              .{FORMAT_EXTENSIONS[format]}
            </span>
          </div>
        </section>

        {/* Summary + Preview */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preview
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                <span className="font-semibold text-slate-900">
                  {filtered.length}
                </span>{' '}
                record{filtered.length === 1 ? '' : 's'}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                Total{' '}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(totalAmount)}
                </span>
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
                <AlertCircle className="h-5 w-5 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">
                  No records match these filters
                </p>
                <p className="text-xs text-slate-400">
                  Adjust the date range or categories to include data
                </p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Category</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.slice(0, PREVIEW_ROWS).map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: CATEGORY_COLORS[e.category] }}
                            />
                            {e.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <span className="line-clamp-1">{e.description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length > PREVIEW_ROWS && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-center text-xs text-slate-500">
                    + {filtered.length - PREVIEW_ROWS} more record
                    {filtered.length - PREVIEW_ROWS === 1 ? '' : 's'} will be included
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            {completedAt
              ? 'Download started.'
              : `Exporting as ${FORMAT_LABELS[format]}`}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={!canExport}
              loading={exporting}
            >
              {completedAt ? (
                <>
                  <Check className="h-4 w-4" />
                  Exported
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export {filtered.length > 0 ? `(${filtered.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
