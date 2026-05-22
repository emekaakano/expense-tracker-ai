# Expense Tracker

A modern personal-finance dashboard for tracking expenses with month-over-month trends, category breakdowns, and configurable CSV / JSON / PDF exports — built entirely client-side. 

PS: I must add that this originated as a practice exercise from my learnings on the Course - Generative AI Software Engineering Specialization by Vanderbilt University on Coursera, even as I embark on my journey of building more interesting and useful solutions/product on journey of becoming a Digital Transformation and AI literacy Expert.

**Live demo:** **[expense-tracker-ai-murex.vercel.app](https://expense-tracker-ai-murex.vercel.app)**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3-FF6384)](https://recharts.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)](https://vercel.com)

![Dashboard screenshot](docs/screenshots/dashboard.png)

---

## Overview

A polished single-user expense tracker that runs entirely in the browser — no backend, no database, no auth required. All state persists locally via `localStorage`, making it instant to load, free to host, and trivial to fork.

The project doubles as a study in **deliberate design tradeoffs**: the export feature was built three different ways (simple, advanced, cloud-style) before the middle approach was chosen as the production version. The two unused implementations remain in the repo as documented alternatives — see [_A note on the design process_](#a-note-on-the-design-process) below.

---

## Features

### 📊 Dashboard
- Live monthly spending trend (6-month bar chart)
- Category breakdown (donut chart with custom legend)
- Summary cards: total spent, this month, last month, top category
- Recent expenses preview with quick edit/delete

### 💸 Expense management
- Add / edit / delete with inline validation (amount, category, description, date)
- Search, multi-filter, and multi-column sort
- Sample data seeded on first visit so the UI is never empty

### 📤 Configurable export
- CSV / JSON / PDF formats (PDF rendered via `jsPDF` + `jspdf-autotable`)
- Date-range and category filters with cross-validation
- Live record count + total amount preview before export
- Custom filename input with auto-suffixed extension
- Scrollable preview table of the first matching rows

### ⚡ Quality details
- Responsive across mobile, tablet, and desktop
- Hydration-safe Recharts integration (avoids SSR/CSR mismatch)
- Accessible modal with `Escape` to close + backdrop click
- Zero external API calls — works offline after first load

---

## A note on the design process

Rather than implementing the export feature once, three competing approaches were prototyped on separate branches to study the tradeoffs:

| Branch | Approach | Status |
|---|---|---|
| [`feature-data-export-v1`](../../tree/feature-data-export-v1) | **Simple** — one-click CSV download from a button on the dashboard | Closed — useful as a low-friction reference |
| [`feature-data-export-v2`](../../tree/feature-data-export-v2) | **Advanced** — modal dialog with format picker, filters, live preview, and loading states | ✅ **Shipped** |
| [`feature-data-export-v3`](../../tree/feature-data-export-v3) | **Cloud Hub** — slide-in drawer with simulated Google Sheets / Drive / Dropbox / OneDrive integration, share links + QR codes, recurring backup schedule, and an activity feed | Closed — kept as a stretch-scope exploration |

The v2 ("advanced") implementation was chosen for the best balance of power, polish, and complexity. The unused versions remain visible as [closed pull requests](../../pulls?q=is%3Apr+is%3Aclosed) for context.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** |
| Charts | **Recharts 3** |
| Icons | **Lucide React** |
| PDF generation | **jsPDF** + **jspdf-autotable** |
| State | **React Context** + `useState` |
| Persistence | **`localStorage`** |
| Hosting | **Vercel** (auto-deploy on push to `master`) |

No backend, no database, no third-party APIs. The entire app ships as a static client-side bundle.

---

## Project structure

```
app/
  page.tsx              Dashboard route (summary + charts + recent)
  expenses/page.tsx     Full expense list with filter + sort
  layout.tsx            Root layout with ExpenseProvider

components/
  dashboard/            Summary cards, monthly chart, category chart
  expenses/             List, form modal, filters
  export/               ExportDialog (modal with format picker + filters)
  layout/               Header, Sidebar, MobileNav
  ui/                   Button, Modal — reusable primitives

context/
  ExpenseContext.tsx    Single source of truth for expense state

lib/
  types.ts              Shared TypeScript types
  constants.ts          Category metadata (colors, icons, badges)
  storage.ts            localStorage read/write + sample data seed
  utils.ts              Currency / date formatting + monthly totals
  export.ts             CSV / JSON / PDF export utilities
```

---

## Running locally

```bash
git clone https://github.com/emekaakano/expense-tracker-ai.git
cd expense-tracker-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build locally |
| `npm run lint` | ESLint over the codebase |
| `npx tsc --noEmit` | Type-check without emitting JS |

---

## Deployment

This project is deployed to [Vercel](https://vercel.com) and configured to auto-deploy on every push to `master`. Each push triggers:

1. Install dependencies
2. Run `next build` (which includes type-checking + ESLint)
3. Serve the optimized static bundle

No special configuration is required — Vercel auto-detects Next.js. To deploy your own copy, fork this repo and import it into Vercel.

---

## License

MIT — feel free to use this as a starting point or reference.
