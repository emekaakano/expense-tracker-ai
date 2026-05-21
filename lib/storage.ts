import { Expense } from './types';
import { STORAGE_KEY } from './constants';

export function loadExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Expense[];
    const samples = getSampleExpenses();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
    return samples;
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    // Storage full or unavailable
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function getSampleExpenses(): Expense[] {
  const ts = new Date().toISOString();
  return [
    { id: 's1',  amount: 85.42,  category: 'Food',           description: 'Weekly groceries',       date: daysAgo(1),  createdAt: ts },
    { id: 's2',  amount: 45.00,  category: 'Transportation', description: 'Monthly bus pass',       date: daysAgo(2),  createdAt: ts },
    { id: 's3',  amount: 12.99,  category: 'Entertainment',  description: 'Netflix subscription',   date: daysAgo(3),  createdAt: ts },
    { id: 's4',  amount: 234.50, category: 'Shopping',       description: 'Winter jacket',          date: daysAgo(5),  createdAt: ts },
    { id: 's5',  amount: 120.00, category: 'Bills',          description: 'Electricity bill',       date: daysAgo(7),  createdAt: ts },
    { id: 's6',  amount: 28.75,  category: 'Food',           description: 'Restaurant dinner',      date: daysAgo(8),  createdAt: ts },
    { id: 's7',  amount: 15.00,  category: 'Transportation', description: 'Uber ride',              date: daysAgo(10), createdAt: ts },
    { id: 's8',  amount: 9.99,   category: 'Entertainment',  description: 'Spotify subscription',   date: daysAgo(12), createdAt: ts },
    { id: 's9',  amount: 67.80,  category: 'Food',           description: 'Coffee shop & lunch',    date: daysAgo(14), createdAt: ts },
    { id: 's10', amount: 89.00,  category: 'Bills',          description: 'Internet service',       date: daysAgo(15), createdAt: ts },
    { id: 's11', amount: 189.99, category: 'Shopping',       description: 'Shoes',                  date: daysAgo(18), createdAt: ts },
    { id: 's12', amount: 35.00,  category: 'Transportation', description: 'Gas refill',             date: daysAgo(20), createdAt: ts },
    { id: 's13', amount: 52.60,  category: 'Food',           description: 'Grocery run',            date: daysAgo(22), createdAt: ts },
    { id: 's14', amount: 24.99,  category: 'Entertainment',  description: 'Movie tickets',          date: daysAgo(25), createdAt: ts },
    { id: 's15', amount: 300.00, category: 'Bills',          description: 'Rent contribution',      date: daysAgo(28), createdAt: ts },
    { id: 's16', amount: 44.20,  category: 'Food',           description: 'Fast food & snacks',     date: daysAgo(30), createdAt: ts },
    { id: 's17', amount: 129.00, category: 'Shopping',       description: 'Online electronics',     date: daysAgo(33), createdAt: ts },
    { id: 's18', amount: 18.50,  category: 'Transportation', description: 'Parking fees',           date: daysAgo(35), createdAt: ts },
    { id: 's19', amount: 95.00,  category: 'Bills',          description: 'Phone bill',             date: daysAgo(38), createdAt: ts },
    { id: 's20', amount: 33.80,  category: 'Food',           description: 'Lunch with colleagues',  date: daysAgo(40), createdAt: ts },
    { id: 's21', amount: 49.99,  category: 'Entertainment',  description: 'Gaming subscription',    date: daysAgo(43), createdAt: ts },
    { id: 's22', amount: 76.40,  category: 'Shopping',       description: 'Home supplies',          date: daysAgo(45), createdAt: ts },
    { id: 's23', amount: 22.00,  category: 'Transportation', description: 'Train tickets',          date: daysAgo(48), createdAt: ts },
    { id: 's24', amount: 145.00, category: 'Bills',          description: 'Insurance payment',      date: daysAgo(50), createdAt: ts },
    { id: 's25', amount: 63.15,  category: 'Food',           description: 'Grocery shopping',       date: daysAgo(52), createdAt: ts },
  ];
}
