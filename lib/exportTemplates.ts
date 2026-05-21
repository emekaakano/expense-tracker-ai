import { Expense, Category } from './types';

export type TemplateId = 'custom' | 'tax' | 'monthly' | 'category';

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  gradient: string;
  ring: string;
  defaultFormat: 'CSV' | 'PDF' | 'Sheets';
  range: 'all' | 'thisMonth' | 'lastMonth' | 'ytd' | 'lastYear';
}

export const TEMPLATES: ExportTemplate[] = [
  {
    id: 'monthly',
    name: 'Monthly Summary',
    tagline: 'This month at a glance',
    description: 'All expenses from the current month, ready for review.',
    gradient: 'from-violet-500 to-indigo-500',
    ring: 'ring-violet-200',
    defaultFormat: 'CSV',
    range: 'thisMonth',
  },
  {
    id: 'tax',
    name: 'Tax Report',
    tagline: 'Year-to-date for filing',
    description: 'Year-to-date totals organized by category for tax prep.',
    gradient: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-200',
    defaultFormat: 'PDF',
    range: 'ytd',
  },
  {
    id: 'category',
    name: 'Category Analysis',
    tagline: 'Where your money goes',
    description: 'All-time breakdown grouped by spending category.',
    gradient: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-200',
    defaultFormat: 'Sheets',
    range: 'all',
  },
  {
    id: 'custom',
    name: 'Custom Export',
    tagline: 'Pick your own filters',
    description: 'Start blank and build the export you need.',
    gradient: 'from-slate-500 to-slate-700',
    ring: 'ring-slate-200',
    defaultFormat: 'CSV',
    range: 'all',
  },
];

export function getTemplate(id: TemplateId): ExportTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[3];
}

function rangeBounds(range: ExportTemplate['range']): {
  start: string | null;
  end: string | null;
} {
  if (range === 'all') return { start: null, end: null };
  const now = new Date();
  let start: Date, end: Date;
  switch (range) {
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
      break;
    case 'lastYear':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      break;
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function applyTemplate(template: ExportTemplate, expenses: Expense[]): Expense[] {
  const { start, end } = rangeBounds(template.range);
  return expenses
    .filter((e) => {
      if (start && e.date < start) return false;
      if (end && e.date > end) return false;
      return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function templateRangeLabel(template: ExportTemplate): string {
  switch (template.range) {
    case 'all':
      return 'All time';
    case 'thisMonth':
      return 'This month';
    case 'lastMonth':
      return 'Last month';
    case 'ytd':
      return `${new Date().getFullYear()} year-to-date`;
    case 'lastYear':
      return `${new Date().getFullYear() - 1}`;
  }
}

export function summarizeByCategory(
  expenses: Expense[]
): { category: Category; total: number; count: number }[] {
  const map = new Map<Category, { total: number; count: number }>();
  for (const e of expenses) {
    const cur = map.get(e.category) ?? { total: 0, count: 0 };
    map.set(e.category, { total: cur.total + e.amount, count: cur.count + 1 });
  }
  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);
}
