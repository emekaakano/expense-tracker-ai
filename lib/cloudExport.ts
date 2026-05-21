export type ProviderId =
  | 'email'
  | 'sheets'
  | 'drive'
  | 'dropbox'
  | 'onedrive'
  | 'sharelink';

export interface CloudProvider {
  id: ProviderId;
  name: string;
  tagline: string;
  category: 'communication' | 'spreadsheet' | 'storage' | 'sharing';
  gradient: string;
  ring: string;
  requiresAuth: boolean;
}

export const PROVIDERS: Record<ProviderId, CloudProvider> = {
  email: {
    id: 'email',
    name: 'Email Delivery',
    tagline: 'Send a CSV attachment to any inbox',
    category: 'communication',
    gradient: 'from-rose-400 to-red-500',
    ring: 'ring-rose-100',
    requiresAuth: false,
  },
  sheets: {
    id: 'sheets',
    name: 'Google Sheets',
    tagline: 'Sync as a live spreadsheet',
    category: 'spreadsheet',
    gradient: 'from-emerald-400 to-green-600',
    ring: 'ring-emerald-100',
    requiresAuth: true,
  },
  drive: {
    id: 'drive',
    name: 'Google Drive',
    tagline: 'Upload to your Drive folder',
    category: 'storage',
    gradient: 'from-amber-400 via-yellow-500 to-blue-500',
    ring: 'ring-amber-100',
    requiresAuth: true,
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    tagline: 'Save to /Apps/ExpenseTracker',
    category: 'storage',
    gradient: 'from-sky-400 to-blue-600',
    ring: 'ring-sky-100',
    requiresAuth: true,
  },
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    tagline: 'Back up to Microsoft 365',
    category: 'storage',
    gradient: 'from-blue-400 to-indigo-600',
    ring: 'ring-blue-100',
    requiresAuth: true,
  },
  sharelink: {
    id: 'sharelink',
    name: 'Shareable Link',
    tagline: 'Public link + QR code for quick sharing',
    category: 'sharing',
    gradient: 'from-violet-400 to-fuchsia-500',
    ring: 'ring-violet-100',
    requiresAuth: false,
  },
};

export const ORDERED_PROVIDERS: ProviderId[] = [
  'email',
  'sheets',
  'drive',
  'dropbox',
  'onedrive',
  'sharelink',
];

function delay(min: number, max: number): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function simulateConnect(id: ProviderId): Promise<void> {
  const min = PROVIDERS[id].category === 'storage' ? 1100 : 800;
  await delay(min, min + 700);
}

export async function simulateDispatch(
  id: ProviderId,
  meta: { templateName: string; recordCount: number; destination?: string }
): Promise<{ remoteUrl?: string }> {
  await delay(1200, 2200);
  switch (id) {
    case 'sheets':
      return { remoteUrl: `https://docs.google.com/spreadsheets/d/${randomToken(20)}` };
    case 'drive':
      return { remoteUrl: `https://drive.google.com/file/d/${randomToken(28)}` };
    case 'dropbox':
      return {
        remoteUrl: `https://www.dropbox.com/scl/fi/${randomToken(16)}/${encodeURIComponent(meta.templateName)}.csv`,
      };
    case 'onedrive':
      return { remoteUrl: `https://1drv.ms/x/s!${randomToken(18)}` };
    case 'email':
      return {};
    case 'sharelink':
      return {};
  }
}

function randomToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export interface ShareLink {
  url: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export function generateShareLink(): ShareLink {
  const token = randomToken(11);
  const created = new Date();
  const expires = new Date(created.getTime() + 1000 * 60 * 60 * 24 * 7);
  return {
    url: `https://expenses.app/s/${token}`,
    token,
    createdAt: created.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

export type ScheduleFrequency = 'off' | 'daily' | 'weekly' | 'monthly';

export const SCHEDULE_LABELS: Record<ScheduleFrequency, string> = {
  off: 'Off',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function describeNextRun(frequency: ScheduleFrequency): string | null {
  if (frequency === 'off') return null;
  const now = new Date();
  const next = new Date(now);
  switch (frequency) {
    case 'daily':
      next.setDate(now.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      break;
    case 'weekly':
      next.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
      next.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(now.getMonth() + 1, 1);
      next.setHours(9, 0, 0, 0);
      break;
  }
  return next.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
