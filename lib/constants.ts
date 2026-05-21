import { Category } from './types';

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f97316',
  Transportation: '#3b82f6',
  Entertainment: '#a855f7',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Other: '#6b7280',
};

export const CATEGORY_BADGE: Record<Category, string> = {
  Food: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  Transportation: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Entertainment: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  Shopping: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
  Bills: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  Other: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
};

export const CATEGORY_DOT: Record<Category, string> = {
  Food: 'bg-orange-400',
  Transportation: 'bg-blue-400',
  Entertainment: 'bg-purple-400',
  Shopping: 'bg-pink-400',
  Bills: 'bg-red-400',
  Other: 'bg-gray-400',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: '🍽️',
  Transportation: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Other: '📦',
};

export const STORAGE_KEY = 'expense-tracker-expenses';
