# Export Feature — Comparative Code Analysis

A systematic technical comparison of three export implementations across `feature-data-export-v1`, `feature-data-export-v2`, and `feature-data-export-v3` against the master baseline (commit `6a2708b`).

| Dimension | v1 — Simple CSV | v2 — Advanced Modal | v3 — Cloud Hub |
|---|---|---|---|
| **Total LOC added (vs baseline)** | ~45 | ~835 | ~1,785 |
| **New files** | 0 | 2 (`lib/export.ts`, `ExportDialog.tsx`) | 6 (3 lib, 1 main UI, 2 primitives) |
| **New npm dependencies** | 0 | 2 (`jspdf`, `jspdf-autotable`) | 0 |
| **Export formats supported** | CSV only | CSV, JSON, PDF | CSV (local) + 5 simulated cloud destinations |
| **UX shell** | Header button | Centered Modal | Right-side slide-in Drawer |
| **State managed** | None | 8 `useState` hooks, 3 `useMemo` derived | 7 `useState` hooks, 1 `useMemo`, 3 localStorage keys |
| **Persistence** | None | None | localStorage (history, connections, schedule) |
| **Error handling** | None | `try/catch` + UI banner | `try/catch` + toast state machine |
| **Loading state** | None (synchronous) | `exporting` + 300 ms minimum spinner | Per-provider toast state machine |

---

## v1 — Simple CSV

### Files created / modified

| File | Change | Lines |
|---|---|---|
| `lib/utils.ts` | Added `exportToCSV()` function at the end | +19 |
| `components/layout/Header.tsx` | Added optional `secondaryAction` prop with hardcoded `Download` icon | +28 / -8 |
| `app/page.tsx` | Imported `exportToCSV`, passed `secondaryAction` to `Header` | +2 |
| `components/dashboard/CategoryChart.tsx` | _Unrelated visual fix_ — pie shrink + legend restructure | +36 / -22 |

### Architecture overview

**Pattern: Inline utility, zero abstraction.** The export logic lives as a single synchronous function in the existing `lib/utils.ts` utility file alongside `formatCurrency`, `getMonthlyTotals`, etc. No new modules, no new types, no new components.

The UI integration is achieved by extending the existing `Header` component with a `secondaryAction` prop, which renders a `<Button variant="secondary">` with a hardcoded `Download` icon. The dashboard page wires its `expenses` array into the secondary action's `onClick` handler.

### Key components and responsibilities

| Symbol | File | Responsibility |
|---|---|---|
| `exportToCSV(expenses)` | `lib/utils.ts` | Build CSV string, wrap in Blob, trigger download |
| `Header` (extended) | `components/layout/Header.tsx` | Render title + up to two action buttons |
| Dashboard `secondaryAction` prop | `app/page.tsx` | Wire context's `expenses` into the export call |

### Implementation details

**File generation approach:**
```ts
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `expenses-${getTodayString()}.csv`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

Standard browser-native pattern: anonymous Blob → temporary object URL → invisible anchor → programmatic click → cleanup. Zero dependencies.

**CSV format choices:**
- Columns: `Date, Category, Amount, Description`
- Line terminator: `\n` (Unix-style — risks rendering oddly in legacy Excel on Windows)
- No UTF-8 BOM (non-ASCII characters may display as garbled in Excel without manual import)
- Escaping: only the description field is wrapped in quotes; commas/quotes in other fields would corrupt the file
- Description quote-doubling (`""`) for embedded quotes is correct

**User interaction:** Single click → immediate download. No confirmation, no preview, no options.

**State management:** None. The export is a pure side-effecting function call. Dashboard's React state is untouched.

### Code complexity assessment

**Trivial.** ~19 lines of pure logic. Anyone can read and understand it in under a minute. Cyclomatic complexity = 1.

### Error handling

**None.** No `try/catch`. If `URL.createObjectURL` fails or the anchor-click is suppressed, the user gets no feedback. Function is fire-and-forget with no return value.

### Security considerations

- 🟡 **CSV injection vulnerability:** description field is escaped for quotes but not for spreadsheet formula prefixes (`=`, `+`, `-`, `@`). An expense named `=cmd|"/c calc"!A1` could trigger formula execution in Excel.
- 🟢 **No XSS surface:** content is bound through React's safe text rendering; the Blob is downloaded, not rendered.
- 🟢 **No network exfiltration:** entirely client-local.

### Performance implications

- **O(n)** scan over expenses to build rows.
- Single Blob allocation.
- Blocks the main thread during construction — negligible for <10k records; could stutter at 100k+.
- No memoization needed (called only on click).

### Extensibility and maintainability factors

| Factor | Rating | Note |
|---|---|---|
| Adding new formats | 🔴 Hard | Would require rewriting function or layering on top |
| Adding filters | 🔴 Hard | No place to plumb a filtered subset through |
| Adding a preview | 🔴 Impossible without major rework | No UI state to host a preview |
| Reading the code | 🟢 Trivial | 19 lines, top-to-bottom |
| Modifying the column order | 🟢 Easy | Single array literal |
| Test surface | 🟢 Pure-ish | Function takes data and returns void; only side effect is DOM |

The strength is also the weakness: there's nothing to extend gracefully.

---

## v2 — Advanced Modal

### Files created / modified

| File | Change | Lines |
|---|---|---|
| `lib/export.ts` | **NEW** — per-format async exporters + dispatcher | +140 |
| `components/export/ExportDialog.tsx` | **NEW** — modal with format picker, filters, preview, loading state | +425 |
| `app/page.tsx` | Replaced `Header` action with custom inline action row; wired up dialog | +38 / -6 |
| `package.json` | Added `jspdf@^4.2.1` and `jspdf-autotable@^5.0.8` | +2 |
| `package-lock.json` | Lock file updates | +236 |

### Architecture overview

**Pattern: Dedicated module + heavy stateful component.** Export logic graduates from utility-file resident to its own `lib/export.ts` module with a clean dispatcher API (`runExport(format, expenses, filename)`). The UI lives in a self-contained `ExportDialog` component that manages its own state and orchestrates the export.

Key architectural shifts vs v1:
- All export functions return `Promise<void>` (even the synchronous ones) so the dialog can `await` and show a loading state uniformly.
- A `runExport` dispatcher wraps a `switch` over format — extensible by adding a case and a function.
- The dialog is a pure consumer of `lib/export.ts` — UI and file generation are cleanly separated.

### Key components and responsibilities

| Symbol | File | Responsibility |
|---|---|---|
| `exportAsCSV` | `lib/export.ts` | Generate CSV with broader escaping, CRLF, UTF-8 BOM |
| `exportAsJSON` | `lib/export.ts` | Generate structured JSON payload with metadata wrapper |
| `exportAsPDF` | `lib/export.ts` | Generate formatted PDF with header, table, page numbers via jsPDF |
| `runExport` | `lib/export.ts` | Dispatch to the right exporter based on format enum |
| `triggerDownload` | `lib/export.ts` (private) | Shared Blob → anchor → click → cleanup |
| `ExportDialog` | `components/export/ExportDialog.tsx` | All UI + form state + filter logic + preview |

### Libraries and dependencies

- **`jspdf@^4.2.1`** — generates the PDF document at the byte level
- **`jspdf-autotable@^5.0.8`** — plugin that renders styled tables into a jsPDF instance
- All other formats use native browser APIs

### Implementation details

**File generation approach (per format):**

| Format | Mechanism | Notable details |
|---|---|---|
| CSV | Blob + anchor click | CRLF line terminators, UTF-8 BOM prefix `'﻿'`, broader cell escaping via `escapeCsvCell` regex |
| JSON | Blob + anchor click | Wrapped in `{exportedAt, recordCount, totalAmount, expenses: [...]}` — not bare array |
| PDF | `doc.save(filename)` (jsPDF internal) | Letter size, Helvetica, autoTable plugin with alternating rows, violet header, `Page X of Y` footer, generation timestamp |

**Filename handling:**
- Custom input field shows base name only; extension is auto-appended based on selected format
- Sanitizes Windows-reserved characters before download: `[\\/:*?"<>|]` → `_`
- Defaults to `expenses-YYYY-MM-DD`

**User interaction flow:**
1. Click "Export" button on dashboard → `setExportOpen(true)`
2. Dialog opens; on mount/open, reset form state via `useEffect`
3. User picks format → re-render with extension suffix updated
4. User toggles date range / categories → `useMemo` recomputes `filtered` and `totalAmount`
5. User clicks Export → 300 ms artificial delay (so spinner is visible) → `runExport()` → success state → auto-close after 900 ms

**State management:**
```ts
const [format, setFormat] = useState<ExportFormat>('csv');
const [dateFrom, setDateFrom] = useState('');
const [dateTo, setDateTo] = useState('');
const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(CATEGORIES));
const [filename, setFilename] = useState(defaultFilename());
const [exporting, setExporting] = useState(false);
const [completedAt, setCompletedAt] = useState<number | null>(null);
const [error, setError] = useState<string | null>(null);
```

8 hooks for the dialog alone. Form is uncontrolled-via-state (no form library). Reset is handled imperatively on `open` change.

**Derived state:** three `useMemo` blocks for `dateRangeError`, `filtered`, and `totalAmount`.

**Edge cases handled:**
- Empty filtered result → preview shows empty state, Export button disabled
- Cleared categories → Export button disabled
- Invalid date range (start > end) → red validation message, Export disabled
- Long filename without extension → auto-suffixed
- OS-reserved characters in filename → replaced with `_`
- jsPDF/Blob throwing → caught, error message displayed in red banner

### Code complexity assessment

**Moderate.** The 425-line dialog is a big React component but it's structurally simple — predominantly JSX with one async handler. Most complexity is in the form-state coordination, not algorithmic logic. Cyclomatic complexity of `handleExport` ≈ 4 (filename branches + try/catch).

### Error handling

**Layered.** The `runExport` dispatcher throws if a format is missing (the `switch` is exhaustive over a union type, so TypeScript catches this at compile time). The dialog wraps the call in `try/catch`, sets a user-facing error message, and never leaves the dialog in a stuck "exporting" state thanks to a `finally` block.

### Security considerations

- 🟡 **Same CSV injection risk as v1** — formula-prefix characters are not stripped. Description and category fields could carry an injection payload.
- 🟢 **Filename sanitization** prevents path traversal and OS-reserved-character attacks.
- 🟢 **JSON output is type-checked** — only expense fields are included, not arbitrary user data.
- 🟢 **PDF text is set via jsPDF text APIs**, which treat input as plain text — no PDF JavaScript injection surface.
- 🟢 **No network calls** — entirely client-local.

### Performance implications

- CSV/JSON: same as v1 (O(n)). Negligible overhead from the format dispatcher.
- **PDF: significantly heavier.** jsPDF ships ~280 KB minified; the bundle weight adds to first-load. PDF rendering itself is CPU-bound and blocks the main thread for ~50–200 ms on a 25-row report; could climb to seconds for >1000 rows.
- `useMemo` correctly memoizes the filtered set so toggling unrelated state doesn't re-filter.
- The dialog's preview table only renders the first 5 rows (`PREVIEW_ROWS` constant) regardless of result size — protects against rendering 10k rows.

### Extensibility and maintainability factors

| Factor | Rating | Note |
|---|---|---|
| Adding a new format (e.g. XLSX) | 🟢 Easy | Add to enum, write `exportAsXlsx`, add a case to `runExport`, add to `FORMAT_OPTIONS` array |
| Adding a new filter | 🟢 Easy | Add state, add UI, augment `filtered` useMemo |
| Adding a preview column | 🟢 Easy | Modify the preview `<table>` JSX |
| Reading the dialog | 🟡 Moderate | 425 lines is long but linear |
| Testing | 🟡 Moderate | Pure `runExport` is testable; dialog needs RTL + jsdom for full coverage |
| Theming/customization | 🟢 Easy | Tailwind classes, format options are data-driven |

The clean separation between `lib/export.ts` and `ExportDialog.tsx` is the architectural win — file generation logic is reusable from elsewhere (e.g. a CLI script or a different UI shell).

---

## v3 — Cloud Hub

### Files created / modified

| File | Change | Lines |
|---|---|---|
| `lib/cloudExport.ts` | **NEW** — provider metadata + simulated async services | +180 |
| `lib/exportHistory.ts` | **NEW** — localStorage persistence (history, connections, schedule) | +178 |
| `lib/exportTemplates.ts` | **NEW** — 4 report templates with date-range presets | +131 |
| `components/export/ExportHubDrawer.tsx` | **NEW** — composite drawer with all sections inline | +1059 |
| `components/ui/Drawer.tsx` | **NEW** — slide-in right panel primitive | +94 |
| `components/ui/PseudoQR.tsx` | **NEW** — deterministic QR-style SVG from a string seed | +107 |
| `app/page.tsx` | Inline action row + drawer wiring | +42 / -6 |

### Architecture overview

**Pattern: Service simulation layer + composite UI surface.** Where v2 has one library module and one component, v3 has a 3-layer architecture:

1. **Service layer** (`lib/cloudExport.ts`): provider definitions, simulated async APIs (`simulateConnect`, `simulateDispatch`, `generateShareLink`), per-provider URL shape generators
2. **Persistence layer** (`lib/exportHistory.ts`): localStorage-backed CRUD for history, connection state, and schedule
3. **Template layer** (`lib/exportTemplates.ts`): presets that map a `TemplateId` to a filtered expense set + suggested format
4. **UI layer** (`components/export/ExportHubDrawer.tsx`): orchestrates all three layers in one drawer

Plus two new UI primitives that didn't exist before:
- `Drawer` (right-slide animation, distinct from the centered `Modal`)
- `PseudoQR` (hand-rolled QR-pattern SVG with proper finder patterns + timing pattern + hash-seeded data cells — zero deps)

### Key components and responsibilities

| Symbol | File | Responsibility |
|---|---|---|
| `PROVIDERS` | `lib/cloudExport.ts` | Provider metadata: gradient classes, tagline, auth requirement |
| `simulateConnect(id)` | `lib/cloudExport.ts` | 800–1800 ms delayed "OAuth"; longer for storage providers |
| `simulateDispatch(id, meta)` | `lib/cloudExport.ts` | 1200–2200 ms delay, returns realistic provider-shaped URL |
| `generateShareLink()` | `lib/cloudExport.ts` | Random 11-char token + 7-day expiry |
| `loadHistory` / `appendHistory` / `clearHistory` | `lib/exportHistory.ts` | localStorage CRUD with 30-entry cap |
| `loadConnections` / `saveConnections` | `lib/exportHistory.ts` | Set of connected provider IDs |
| `loadSchedule` / `saveSchedule` | `lib/exportHistory.ts` | Recurring backup config |
| `TEMPLATES` | `lib/exportTemplates.ts` | Monthly Summary, Tax Report, Category Analysis, Custom |
| `applyTemplate(template, expenses)` | `lib/exportTemplates.ts` | Apply date-range preset, return filtered subset |
| `describeNextRun(frequency)` | `lib/cloudExport.ts` | Compute next 9 AM occurrence for daily/weekly/monthly schedules |
| `Drawer` | `components/ui/Drawer.tsx` | Slide-in panel with focus trap, backdrop, animation |
| `PseudoQR` | `components/ui/PseudoQR.tsx` | Deterministic hash-seeded 25×25 SVG |
| `ExportHubDrawer` | `components/export/ExportHubDrawer.tsx` | Compose all sections, manage `ToastState`, dispatch user actions |

### Libraries and dependencies

**Zero new npm dependencies.** Notable because the natural choices would have been `qrcode.react` (for the QR code) or `dayjs` (for date math) — both replaced with hand-rolled implementations to demonstrate dependency-conservation discipline.

### Implementation details

**Service simulation pattern:**
```ts
async function delay(min: number, max: number): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function simulateDispatch(id, meta) {
  await delay(1200, 2200);
  switch (id) {
    case 'sheets': return { remoteUrl: `https://docs.google.com/spreadsheets/d/${randomToken(20)}` };
    case 'drive':  return { remoteUrl: `https://drive.google.com/file/d/${randomToken(28)}` };
    case 'dropbox': return { remoteUrl: `https://www.dropbox.com/scl/fi/${randomToken(16)}/...` };
    case 'onedrive': return { remoteUrl: `https://1drv.ms/x/s!${randomToken(18)}` };
    // ...
  }
}
```

Realistic enough that the success toast's "Open" link actually opens a believable (404-ing) URL.

**Persistence model:**
```ts
const HISTORY_KEY = 'expense-export-history-v1';
const CONNECTIONS_KEY = 'expense-cloud-connections-v1';
const SCHEDULE_KEY = 'expense-backup-schedule-v1';
const HISTORY_LIMIT = 30;
```

All three are versioned with a `-v1` suffix (forward-compatible — a future schema change can use `-v2` while leaving old data readable). History is FIFO-capped at 30. All reads/writes are wrapped in `try/catch` so the app degrades gracefully when localStorage is disabled (private browsing, etc.).

**Hash-seeded QR pattern (deterministic, no dependency):**
```ts
function hashString(s) { /* FNV-1a-ish 32-bit hash */ }
function mulberry32(seed) { /* PRNG from seed */ }

// For each (x,y) in 25×25 grid:
//   - if in a corner finder square → render fixed pattern
//   - if on the timing row/column → alternate
//   - else → hash-seeded random
```

Same input string always renders the same pattern, so "Rotate" generating a new token produces a visibly different QR.

**Toast state machine** in the drawer:
```ts
type ToastState =
  | { kind: 'idle' }
  | { kind: 'connecting'; providerId: ProviderId }
  | { kind: 'sending'; providerId: ProviderId | 'download'; label: string }
  | { kind: 'success'; providerId: ProviderId | 'download'; label: string; remoteUrl?: string }
  | { kind: 'error'; message: string };
```

A single state encodes all in-progress and completed actions across the entire drawer. The toast component dispatches based on `kind`.

**User interaction flow:**
1. Click "Export & Share" → drawer slides in from right
2. On mount, load connections, history, schedule from localStorage; reset transient state
3. User picks template → `applyTemplate` filters expenses; record count + total update
4. User clicks "Connect" on a provider → toast → `simulateConnect` → connection persisted
5. User clicks "Send now" → toast → `simulateDispatch` → history appended → success toast with "Open" link
6. Optional: generate share link → QR + URL + expiry render
7. Optional: configure schedule → persisted with computed next-run timestamp

**State management:**
```ts
const [templateId, setTemplateId] = useState<TemplateId>('monthly');
const [connections, setConnections] = useState<ProviderId[]>([]);
const [emailRecipient, setEmailRecipient] = useState('');
const [shareLink, setShareLink] = useState<ShareLink | null>(null);
const [linkCopied, setLinkCopied] = useState(false);
const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
const [schedule, setSchedule] = useState<ScheduleState>({ /* ... */ });
const [toast, setToast] = useState<ToastState>({ kind: 'idle' });
```

8 hooks in the main drawer. Note that 4 of them mirror localStorage and are kept in sync via load on mount + save on change.

**Edge cases handled:**
- Empty filtered result → "No expenses to send" error toast
- localStorage unavailable → all functions return defaults silently
- Clipboard API blocked → copy fails silently (no error UI)
- User dismissing drawer mid-send → fire-and-forget continues, history still appended

### Code complexity assessment

**High.** The drawer file is 1,059 lines and contains six sub-components defined inline (`TemplateCard`, `ProviderCard`, `ShareLinkPanel`, `ScheduleCard`, `HistoryItem`, `Toast`, plus a `FieldLabel` helper and `SectionHeading`). Cyclomatic complexity per function stays modest, but the overall surface area is large.

### Error handling

**Most thorough of the three.** Every localStorage call is in `try/catch`. The toast state machine has an explicit `'error'` variant. `simulateConnect` and `simulateDispatch` propagate errors via Promise rejection, caught by the drawer's action handlers.

### Security considerations

- 🟢 **No real network calls** — the "cloud integrations" are entirely simulated; no auth tokens, no PII exfiltration risk.
- 🟢 **Share link tokens are random** but the "shared" URL is fake — a real implementation would need to address token-guess resistance.
- 🟡 **No CSV escaping at all** in v3's local CSV download path — the `handleLocalDownload` function uses a simpler escaping that's inferior to v2's `escapeCsvCell`.
- 🟢 **localStorage scope** — all keys are app-prefixed, no risk of clobbering other apps on same origin.
- 🟢 **PseudoQR is pure rendering** — no decode/execute path, just SVG.

### Performance implications

- **Initial render:** the drawer itself is heavy (~1k lines compiled). However, it only mounts when opened — lazy via React's natural conditional rendering.
- **Hand-rolled QR:** computes a 25×25 = 625-cell grid via a seeded PRNG. ~1 ms. Memoized with `useMemo` against the URL string.
- **localStorage reads:** all on drawer-open, synchronous, ~1 ms even with 30 history entries.
- **No PDF generation in v3** — saves the jsPDF bundle weight, but at the cost of no PDF format option.
- **Animation:** transform-based, GPU-accelerated; transitions don't trigger layout.

### Extensibility and maintainability factors

| Factor | Rating | Note |
|---|---|---|
| Adding a new provider | 🟢 Easy | Add to `PROVIDERS` constant + add a case to `simulateDispatch` |
| Adding a new template | 🟢 Easy | Add to `TEMPLATES` array; `applyTemplate` handles the rest |
| Wiring a real OAuth flow | 🟡 Moderate | Replace `simulateConnect` body, but UI assumes synchronous-feeling resolution |
| Adding a new persistence field | 🟢 Easy | Versioned localStorage keys allow schema migration |
| Reading the drawer file | 🔴 Hard | 1k+ lines with 6 inline sub-components |
| Testing | 🟡 Moderate | Lib files testable in isolation; drawer requires extensive RTL setup |
| Refactoring into smaller files | 🟢 Easy | Each inline sub-component is a clean extraction candidate |

The big maintainability win is the layered library structure; the lurking debt is the monolithic drawer file that would benefit from extraction.

---

## Technical deep dive — cross-cutting comparisons

### How does the export functionality work technically?

| Aspect | v1 | v2 | v3 |
|---|---|---|---|
| **Entry point** | Function call from button `onClick` | `runExport()` from dialog | `simulateDispatch()` per provider; `handleLocalDownload()` for actual file |
| **Format choices** | CSV hardcoded | Enum dispatch (CSV/JSON/PDF) | Template + provider matrix |
| **Output destination** | Local file download | Local file download | Simulated remote + actual local CSV |
| **Async model** | Synchronous void | `async` Promise per format | `async` Promise per provider; nested error handling |

### What file generation approach is used?

| Aspect | v1 | v2 | v3 (download path) |
|---|---|---|---|
| **CSV builder** | Hand-rolled template literals | Per-cell `escapeCsvCell` regex helper | Inline simpler escaping |
| **Line terminator** | `\n` | `\r\n` | `\r\n` |
| **BOM** | No | Yes (`'﻿'`) | Yes (`'﻿'`) |
| **JSON** | n/a | `JSON.stringify` with wrapper object | n/a |
| **PDF** | n/a | jsPDF + autoTable | n/a |
| **Download mechanic** | Direct in function | `triggerDownload` private helper | Direct in `handleLocalDownload` |

### How is user interaction handled?

| Aspect | v1 | v2 | v3 |
|---|---|---|---|
| **Affordance** | One button | One button → modal | One button → drawer with 4 sections |
| **Reversibility** | None (instant export) | Cancel from modal | Cancel/Close from drawer; dismiss toast |
| **Discoverability of options** | None | All visible in modal | Layered: templates → destinations → schedule |
| **Cognitive load** | Minimal | Moderate (form-style) | High (dashboard-style) |

### What state management patterns are used?

| Aspect | v1 | v2 | v3 |
|---|---|---|---|
| **Source of truth** | Just the `expenses` array from context | Local component state | Component state + localStorage |
| **Reset on open** | n/a | `useEffect` on `open` prop | `useEffect` on `open` prop |
| **Derived state** | n/a | 3 × `useMemo` | 1 × `useMemo` + per-render `applyTemplate` |
| **State machine** | n/a | Implicit (booleans) | Explicit (`ToastState` discriminated union) |
| **Persistence** | None | None | localStorage with versioned keys |

### How are edge cases handled?

| Edge case | v1 | v2 | v3 |
|---|---|---|---|
| Empty result set | Exports empty CSV silently | Disables Export button, shows empty preview | Toast: "No expenses to send for this template" |
| Invalid filename | n/a | Sanitized to safe chars + suffixed extension | Hardcoded slugified template name |
| Storage unavailable | n/a | n/a | All persistence wrapped in try/catch |
| Clipboard blocked | n/a | n/a | Silent failure (no error UI) |
| jsPDF error | n/a | Caught, surfaced in error banner | n/a |
| User closes mid-export | Synchronous, can't | Modal stays until success/error | Drawer can be closed; Promise resolves into ether |

---

## Code complexity assessment — head-to-head

| Metric | v1 | v2 | v3 |
|---|---|---|---|
| Total LOC | ~45 | ~835 | ~1,785 |
| New files | 0 | 2 | 6 |
| Cyclomatic complexity (peak fn) | 1 | 4 | 5 |
| State variables in main UI | 0 | 8 | 8 |
| New TypeScript types/interfaces | 0 | 1 (`ExportFormat`) | 8+ (providers, templates, history, schedule, toast, share link) |
| External dependencies added | 0 | 2 | 0 |
| Files >100 LOC | 0 | 2 | 4 |
| Largest single file | 19 lines (function) | 425 lines | 1,059 lines |

---

## Strategic recommendation matrix

### When to pick **v1**

- ✅ Pre-launch MVP where the export feature is "we said it would be there"
- ✅ Apps where the export is genuinely one-shot and configuration is unwanted noise
- ✅ Heavily resource-constrained projects (mobile-first, low bandwidth, slow devices)
- ❌ Avoid when users have real preferences about format/scope; you'll outgrow it within weeks

### When to pick **v2** _(chosen as the production version on master)_

- ✅ Real users with real export needs — different formats, filters, named files
- ✅ Apps where the export is occasional but important (tax season, monthly reporting)
- ✅ Codebases that value clean separation between data logic and UI shell
- ❌ Avoid if you genuinely need cloud integration or collaboration features
- ❌ Avoid if 280 KB of `jspdf` is a deal-breaker for first-load bundle weight

### When to pick **v3**

- ✅ Apps with a "Share" / "Collaboration" identity (Notion, Airtable, Linear)
- ✅ When the feature is itself a marketing surface that demonstrates product polish
- ✅ When you genuinely intend to integrate real cloud services later (simulation is the wireframe)
- ❌ Avoid as the final production version without backing the simulations with real APIs — visitors will eventually try the "Connect" buttons and discover they're cosmetic
- ❌ Avoid if the team can't maintain a 1k-line component

### Hybrid recommendations

If a future iteration wanted to combine strengths:

1. **v2's `lib/export.ts` + v3's template layer** — let users save a configured export as a "Tax Report" preset they can re-run with one click
2. **v3's `lib/exportHistory.ts` + v2's dialog** — show the last 5 exports in the dialog as quick-rerun chips
3. **v3's `Drawer` primitive + v2's dialog content** — slide-in form instead of centered modal for a more "Notion-like" feel
4. **v2's PDF + v3's share link** — generate the PDF locally, then push it to a real cloud storage layer with the existing v3 UI

---

## Summary verdict

**v1** is a pragmatic shipped checkbox. It does what it says, in 19 lines, with zero risk and zero polish.

**v2** is the production-quality middle path. It's the only version with multi-format support, the only one with proper filename sanitization, and the only one that ships a fully working PDF generator. The 425-line dialog is the largest single piece of complexity, but it's structurally simple — predominantly JSX, with clean state management.

**v3** is the most architecturally ambitious. The 3-library layered structure (services / persistence / templates) is the cleanest separation of concerns of the three. The hand-rolled `Drawer` and `PseudoQR` primitives demonstrate dependency-conservation discipline. But the simulated cloud integrations create a credibility gap: the feature *looks* real but doesn't actually do what its labels promise. For production use this would need real OAuth + real cloud APIs behind it.

The choice to ship v2 on `master` is defensible: it's the only version that's fully real (no simulations), supports the broadest user need (three formats), and pays for itself in maintainability. v3's library structure and `Drawer` primitive are strong candidates to revisit when the product is ready for a real cloud-collaboration story.
