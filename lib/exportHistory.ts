import { ProviderId } from './cloudExport';
import { ScheduleFrequency } from './cloudExport';

const HISTORY_KEY = 'expense-export-history-v1';
const CONNECTIONS_KEY = 'expense-cloud-connections-v1';
const SCHEDULE_KEY = 'expense-backup-schedule-v1';
const HISTORY_LIMIT = 30;

export type ExportDestination = ProviderId | 'download';

export interface ExportHistoryEntry {
  id: string;
  timestamp: string;
  templateId: string;
  templateName: string;
  destination: ExportDestination;
  destinationName: string;
  format: string;
  recordCount: number;
  totalAmount: number;
  status: 'success' | 'failed';
  remoteUrl?: string;
  recipient?: string;
}

export interface ScheduleState {
  frequency: ScheduleFrequency;
  destination: ExportDestination;
  recipient: string;
  templateId: string;
  enabledAt: string | null;
}

const EMPTY_SCHEDULE: ScheduleState = {
  frequency: 'off',
  destination: 'email',
  recipient: '',
  templateId: 'monthly',
  enabledAt: null,
};

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

function seedHistory(): ExportHistoryEntry[] {
  return [
    {
      id: 'seed-1',
      timestamp: hoursAgo(3),
      templateId: 'monthly',
      templateName: 'Monthly Summary',
      destination: 'email',
      destinationName: 'Email Delivery',
      format: 'CSV',
      recordCount: 12,
      totalAmount: 842.18,
      status: 'success',
      recipient: 'me@example.com',
    },
    {
      id: 'seed-2',
      timestamp: hoursAgo(29),
      templateId: 'tax',
      templateName: 'Tax Report',
      destination: 'sheets',
      destinationName: 'Google Sheets',
      format: 'Sheets',
      recordCount: 25,
      totalAmount: 1763.49,
      status: 'success',
      remoteUrl: 'https://docs.google.com/spreadsheets/d/1aBc2DefGhIjKlMnOpQ',
    },
    {
      id: 'seed-3',
      timestamp: hoursAgo(74),
      templateId: 'category',
      templateName: 'Category Analysis',
      destination: 'download',
      destinationName: 'Local Download',
      format: 'CSV',
      recordCount: 25,
      totalAmount: 1763.49,
      status: 'success',
    },
  ];
}

export function loadHistory(): ExportHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as ExportHistoryEntry[];
    const seeded = seedHistory();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function appendHistory(entry: ExportHistoryEntry): ExportHistoryEntry[] {
  const current = loadHistory();
  const next = [entry, ...current].slice(0, HISTORY_LIMIT);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearHistory(): ExportHistoryEntry[] {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export function loadConnections(): ProviderId[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY);
    if (raw) return JSON.parse(raw) as ProviderId[];
    const seeded: ProviderId[] = ['email', 'sheets'];
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return [];
  }
}

export function saveConnections(ids: ProviderId[]): void {
  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function loadSchedule(): ScheduleState {
  if (typeof window === 'undefined') return EMPTY_SCHEDULE;
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (raw) return JSON.parse(raw) as ScheduleState;
    return EMPTY_SCHEDULE;
  } catch {
    return EMPTY_SCHEDULE;
  }
}

export function saveSchedule(state: ScheduleState): void {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function newHistoryId(): string {
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
