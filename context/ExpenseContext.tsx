'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Expense, ExpenseInput, FilterState, Category } from '@/lib/types';
import { loadExpenses, saveExpenses } from '@/lib/storage';
import { generateId } from '@/lib/utils';

interface ExpenseContextValue {
  expenses: Expense[];
  filteredExpenses: Expense[];
  filters: FilterState;
  addExpense: (data: ExpenseInput) => void;
  updateExpense: (id: string, data: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  setFilters: (partial: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'All',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date',
  sortOrder: 'desc',
};

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    setExpenses(loadExpenses());
  }, []);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    if (filters.category !== 'All') {
      result = result.filter((e) => e.category === (filters.category as Category));
    }

    if (filters.dateFrom) {
      result = result.filter((e) => e.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      result = result.filter((e) => e.date <= filters.dateTo);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (filters.sortBy === 'date') cmp = a.date.localeCompare(b.date);
      else if (filters.sortBy === 'amount') cmp = a.amount - b.amount;
      else cmp = a.category.localeCompare(b.category);
      return filters.sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [expenses, filters]);

  const addExpense = useCallback((data: ExpenseInput) => {
    const newExpense: Expense = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  }, []);

  const updateExpense = useCallback((id: string, data: ExpenseInput) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        filteredExpenses,
        filters,
        addExpense,
        updateExpense,
        deleteExpense,
        setFilters,
        resetFilters,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenseContext() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenseContext must be used within ExpenseProvider');
  return ctx;
}
