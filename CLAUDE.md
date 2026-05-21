# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npx tsc --noEmit  # Type-check without emitting
```

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Recharts · Lucide React

**Data flow:** All state lives in `context/ExpenseContext.tsx` (React Context + `useState`). On mount it reads from `localStorage` via `lib/storage.ts`; every state change saves back immediately. No server-side data fetching — this is a fully client-side app.

**Key files:**
- `lib/types.ts` — shared TypeScript types (`Expense`, `Category`, `FilterState`)
- `lib/constants.ts` — category colors, badge styles, icons, storage key
- `lib/utils.ts` — `formatCurrency`, `exportToCSV`, `getMonthlyTotals`, `getCategoryTotals`, `cn`
- `context/ExpenseContext.tsx` — single source of truth; exports `useExpenseContext` hook
- `lib/storage.ts` — `loadExpenses` (seeds sample data on first load) / `saveExpenses`

**Pages:**
- `app/page.tsx` — Dashboard: summary cards, monthly bar chart, category pie chart, recent expenses
- `app/expenses/page.tsx` — Full expense list with search/filter, edit, delete, CSV export

**Component tree:**
```
app/layout.tsx (Server)
  └─ ExpenseProvider (Client, context)
       ├─ Sidebar (Client, uses usePathname)
       ├─ {children}
       └─ MobileNav (Client)

app/page.tsx (Client)
  ├─ SummaryCards
  ├─ MonthlyChart   ← recharts, guarded with mounted state
  ├─ CategoryChart  ← recharts, guarded with mounted state
  └─ RecentExpenses

app/expenses/page.tsx (Client)
  ├─ ExpenseFilters
  ├─ ExpenseList    ← includes inline delete-confirm modal
  └─ ExpenseForm    ← shared add/edit modal
```

**Recharts / SSR:** Chart components use a `mounted` state guard (`useEffect(() => setMounted(true), [])`) to avoid hydration errors. Never remove this guard when editing chart components.

**Styling conventions:** Tailwind only. Cards use `rounded-2xl bg-white shadow-sm ring-1 ring-slate-100`. Primary color is `violet-600`. Page background is `slate-50` (set in `globals.css`).
