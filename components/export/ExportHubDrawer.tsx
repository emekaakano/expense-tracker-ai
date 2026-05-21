'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Sheet,
  HardDrive,
  Cloud,
  Link2,
  Box,
  Send,
  Plug,
  Plug2,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
  History,
  CalendarClock,
  Sparkles,
  Trash2,
  Download,
  ArrowRight,
  Wifi,
  RefreshCw,
} from 'lucide-react';
import { Expense } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { PseudoQR } from '@/components/ui/PseudoQR';
import {
  ProviderId,
  ORDERED_PROVIDERS,
  PROVIDERS,
  ShareLink,
  generateShareLink,
  simulateConnect,
  simulateDispatch,
  ScheduleFrequency,
  SCHEDULE_LABELS,
  describeNextRun,
} from '@/lib/cloudExport';
import {
  TEMPLATES,
  TemplateId,
  getTemplate,
  applyTemplate,
  templateRangeLabel,
} from '@/lib/exportTemplates';
import {
  ExportHistoryEntry,
  ScheduleState,
  appendHistory,
  clearHistory,
  formatRelativeTime,
  loadConnections,
  loadHistory,
  loadSchedule,
  newHistoryId,
  saveConnections,
  saveSchedule,
} from '@/lib/exportHistory';

const PROVIDER_ICONS: Record<ProviderId, typeof Mail> = {
  email: Mail,
  sheets: Sheet,
  drive: HardDrive,
  dropbox: Box,
  onedrive: Cloud,
  sharelink: Link2,
};

type ToastState =
  | { kind: 'idle' }
  | { kind: 'connecting'; providerId: ProviderId }
  | { kind: 'sending'; providerId: ProviderId | 'download'; label: string }
  | {
      kind: 'success';
      providerId: ProviderId | 'download';
      label: string;
      remoteUrl?: string;
    }
  | { kind: 'error'; message: string };

interface ExportHubDrawerProps {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
}

export function ExportHubDrawer({ open, onClose, expenses }: ExportHubDrawerProps) {
  const [templateId, setTemplateId] = useState<TemplateId>('monthly');
  const [connections, setConnections] = useState<ProviderId[]>([]);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [schedule, setSchedule] = useState<ScheduleState>({
    frequency: 'off',
    destination: 'email',
    recipient: '',
    templateId: 'monthly',
    enabledAt: null,
  });
  const [toast, setToast] = useState<ToastState>({ kind: 'idle' });

  useEffect(() => {
    if (open) {
      setConnections(loadConnections());
      setHistory(loadHistory());
      setSchedule(loadSchedule());
      setToast({ kind: 'idle' });
      setShareLink(null);
      setLinkCopied(false);
    }
  }, [open]);

  const template = getTemplate(templateId);
  const filteredExpenses = useMemo(
    () => applyTemplate(template, expenses),
    [template, expenses]
  );
  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const isConnected = (id: ProviderId) => connections.includes(id);
  const connectedCount = connections.length;
  const totalCount = ORDERED_PROVIDERS.length;

  function pushHistory(entry: ExportHistoryEntry) {
    setHistory(appendHistory(entry));
  }

  async function handleConnect(id: ProviderId) {
    setToast({ kind: 'connecting', providerId: id });
    try {
      await simulateConnect(id);
      const next = Array.from(new Set([...connections, id]));
      setConnections(next);
      saveConnections(next);
      setToast({
        kind: 'success',
        providerId: id,
        label: `Connected to ${PROVIDERS[id].name}`,
      });
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to connect',
      });
    }
  }

  function handleDisconnect(id: ProviderId) {
    const next = connections.filter((c) => c !== id);
    setConnections(next);
    saveConnections(next);
  }

  async function handleDispatch(id: ProviderId, recipient?: string) {
    if (filteredExpenses.length === 0) {
      setToast({ kind: 'error', message: 'No expenses to send for this template' });
      return;
    }
    const provider = PROVIDERS[id];
    setToast({
      kind: 'sending',
      providerId: id,
      label: `Sending ${template.name} to ${provider.name}…`,
    });
    try {
      const result = await simulateDispatch(id, {
        templateName: template.name,
        recordCount: filteredExpenses.length,
        destination: recipient,
      });
      pushHistory({
        id: newHistoryId(),
        timestamp: new Date().toISOString(),
        templateId: template.id,
        templateName: template.name,
        destination: id,
        destinationName: provider.name,
        format: template.defaultFormat,
        recordCount: filteredExpenses.length,
        totalAmount,
        status: 'success',
        remoteUrl: result.remoteUrl,
        recipient,
      });
      setToast({
        kind: 'success',
        providerId: id,
        label: `Sent to ${provider.name}`,
        remoteUrl: result.remoteUrl,
      });
    } catch (err) {
      setToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Send failed',
      });
    }
  }

  async function handleLocalDownload() {
    if (filteredExpenses.length === 0) {
      setToast({ kind: 'error', message: 'No expenses to download for this template' });
      return;
    }
    setToast({
      kind: 'sending',
      providerId: 'download',
      label: 'Preparing download…',
    });
    await new Promise((r) => setTimeout(r, 400));
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const rows = filteredExpenses.map((e) =>
      [e.date, e.category, e.amount.toFixed(2), `"${e.description.replace(/"/g, '""')}"`].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    pushHistory({
      id: newHistoryId(),
      timestamp: new Date().toISOString(),
      templateId: template.id,
      templateName: template.name,
      destination: 'download',
      destinationName: 'Local Download',
      format: 'CSV',
      recordCount: filteredExpenses.length,
      totalAmount,
      status: 'success',
    });

    setToast({
      kind: 'success',
      providerId: 'download',
      label: 'Downloaded locally',
    });
  }

  function handleGenerateShareLink() {
    const link = generateShareLink();
    setShareLink(link);
    setLinkCopied(false);
    pushHistory({
      id: newHistoryId(),
      timestamp: new Date().toISOString(),
      templateId: template.id,
      templateName: template.name,
      destination: 'sharelink',
      destinationName: 'Shareable Link',
      format: template.defaultFormat,
      recordCount: filteredExpenses.length,
      totalAmount,
      status: 'success',
      remoteUrl: link.url,
    });
    setToast({
      kind: 'success',
      providerId: 'sharelink',
      label: 'Share link generated',
      remoteUrl: link.url,
    });
  }

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink.url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      /* clipboard blocked — silent */
    }
  }

  function handleSaveSchedule(next: ScheduleState) {
    const finalSchedule = {
      ...next,
      enabledAt: next.frequency === 'off' ? null : new Date().toISOString(),
    };
    setSchedule(finalSchedule);
    saveSchedule(finalSchedule);
  }

  function handleClearHistory() {
    setHistory(clearHistory());
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Export &amp; Share Hub
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Online
          </span>
          <span>
            {connectedCount} of {totalCount} services connected
          </span>
        </span>
      }
      topAccent={
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500" />
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{template.name}</span>
            <span className="text-slate-400"> · {templateRangeLabel(template)}</span>
            <span className="text-slate-400">
              {' '}· {filteredExpenses.length} record
              {filteredExpenses.length === 1 ? '' : 's'} · {formatCurrency(totalAmount)}
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={handleLocalDownload}
            disabled={filteredExpenses.length === 0}
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      }
    >
      <Toast state={toast} onDismiss={() => setToast({ kind: 'idle' })} />

      <SectionHeading
        icon={Sparkles}
        title="Pick a template"
        subtitle="Pre-shaped reports for common needs"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            active={t.id === templateId}
            recordCount={applyTemplate(t, expenses).length}
            onClick={() => setTemplateId(t.id)}
          />
        ))}
      </div>

      <SectionHeading
        icon={Send}
        title="Send to"
        subtitle="Push this template to a connected service"
        className="mt-7"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ORDERED_PROVIDERS.filter((id) => id !== 'sharelink').map((id) => (
          <ProviderCard
            key={id}
            providerId={id}
            connected={isConnected(id)}
            connecting={
              toast.kind === 'connecting' && toast.providerId === id
            }
            sending={toast.kind === 'sending' && toast.providerId === id}
            justSent={toast.kind === 'success' && toast.providerId === id}
            emailValue={id === 'email' ? emailRecipient : undefined}
            onEmailChange={id === 'email' ? setEmailRecipient : undefined}
            onConnect={() => handleConnect(id)}
            onDisconnect={() => handleDisconnect(id)}
            onSend={() =>
              handleDispatch(
                id,
                id === 'email' ? emailRecipient || 'you@example.com' : undefined
              )
            }
            disabled={filteredExpenses.length === 0}
          />
        ))}
      </div>

      <SectionHeading
        icon={Link2}
        title="Shareable link"
        subtitle="Generate a public URL with a QR code for quick sharing"
        className="mt-7"
      />
      <ShareLinkPanel
        link={shareLink}
        copied={linkCopied}
        onGenerate={handleGenerateShareLink}
        onCopy={copyShareLink}
        onRotate={handleGenerateShareLink}
      />

      <SectionHeading
        icon={CalendarClock}
        title="Recurring backup"
        subtitle="Automatically send this template on a schedule"
        className="mt-7"
      />
      <ScheduleCard
        schedule={schedule}
        connections={connections}
        onChange={handleSaveSchedule}
      />

      <SectionHeading
        icon={History}
        title="Activity"
        subtitle="Your most recent exports across all services"
        action={
          history.length > 0 ? (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : undefined
        }
        className="mt-7"
      />
      <HistoryList history={history} />
    </Drawer>
  );
}

/* -------------------------------------------------------------------------- */
/* Section heading                                                            */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Icon className="h-4 w-4 text-slate-400" />
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toast notification                                                         */
/* -------------------------------------------------------------------------- */

function Toast({ state, onDismiss }: { state: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (state.kind === 'success' || state.kind === 'error') {
      const t = setTimeout(onDismiss, 4500);
      return () => clearTimeout(t);
    }
  }, [state, onDismiss]);

  if (state.kind === 'idle') return null;

  const isBusy = state.kind === 'connecting' || state.kind === 'sending';
  const isError = state.kind === 'error';
  const label =
    state.kind === 'connecting'
      ? `Connecting to ${PROVIDERS[state.providerId].name}…`
      : state.kind === 'sending'
      ? state.label
      : state.kind === 'success'
      ? state.label
      : state.message;

  return (
    <div
      className={cn(
        'mb-5 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm shadow-sm',
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : isBusy
          ? 'border-violet-200 bg-violet-50 text-violet-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      )}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
      ) : isError ? (
        <Plug className="h-4 w-4 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      )}
      <span className="flex-1">{label}</span>
      {state.kind === 'success' && state.remoteUrl && (
        <a
          href={state.remoteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Template card                                                              */
/* -------------------------------------------------------------------------- */

function TemplateCard({
  template,
  active,
  recordCount,
  onClick,
}: {
  template: (typeof TEMPLATES)[number];
  active: boolean;
  recordCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all',
        active
          ? `border-transparent shadow-sm ring-2 ${template.ring}`
          : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
          template.gradient
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{template.name}</div>
          <p className="mt-0.5 text-xs text-slate-500">{template.tagline}</p>
        </div>
        {active && <CheckCircle2 className="h-4 w-4 text-violet-600" />}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">{templateRangeLabel(template)}</span>
        <span className="font-medium text-slate-600">
          {recordCount} record{recordCount === 1 ? '' : 's'}
        </span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Provider card                                                              */
/* -------------------------------------------------------------------------- */

function ProviderCard({
  providerId,
  connected,
  connecting,
  sending,
  justSent,
  emailValue,
  onEmailChange,
  onConnect,
  onDisconnect,
  onSend,
  disabled,
}: {
  providerId: ProviderId;
  connected: boolean;
  connecting: boolean;
  sending: boolean;
  justSent: boolean;
  emailValue?: string;
  onEmailChange?: (v: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const provider = PROVIDERS[providerId];
  const Icon = PROVIDER_ICONS[providerId];
  const requiresAuth = provider.requiresAuth;
  const busy = connecting || sending;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-white p-3.5 transition-shadow',
        justSent ? 'shadow-md ring-2 ring-emerald-100' : 'border-slate-200 shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
            provider.gradient
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {provider.name}
            </p>
            {requiresAuth && (
              <ConnectionBadge connected={connected} connecting={connecting} />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{provider.tagline}</p>
        </div>
      </div>

      {providerId === 'email' && onEmailChange && (
        <input
          type="email"
          value={emailValue ?? ''}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      )}

      <div className="flex items-center justify-between gap-2">
        {requiresAuth && !connected ? (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={onConnect}
            loading={connecting}
            disabled={busy}
          >
            <Plug2 className="h-3.5 w-3.5" />
            Connect
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={onSend}
            loading={sending}
            disabled={busy || disabled}
          >
            {justSent ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sent
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send now
              </>
            )}
          </Button>
        )}
        {requiresAuth && connected && (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={busy}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

function ConnectionBadge({
  connected,
  connecting,
}: {
  connected: boolean;
  connecting: boolean;
}) {
  if (connecting) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Connecting
      </span>
    );
  }
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Offline
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Share link panel                                                           */
/* -------------------------------------------------------------------------- */

function ShareLinkPanel({
  link,
  copied,
  onGenerate,
  onCopy,
  onRotate,
}: {
  link: ShareLink | null;
  copied: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onRotate: () => void;
}) {
  if (!link) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
        <Link2 className="mx-auto h-6 w-6 text-slate-300" />
        <p className="mt-2 text-sm font-medium text-slate-700">No link generated yet</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Create a public URL anyone can use to view the report
        </p>
        <Button size="sm" className="mt-3" onClick={onGenerate}>
          <Link2 className="h-3.5 w-3.5" />
          Generate share link
        </Button>
      </div>
    );
  }

  const expires = new Date(link.expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/40 shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="flex flex-shrink-0 items-center justify-center rounded-lg bg-white p-2 ring-1 ring-slate-200 sm:self-start">
          <PseudoQR value={link.url} size={120} cells={25} color="#0f172a" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Live
            </span>
            <span className="text-xs text-slate-500">Expires {expires}</span>
          </div>

          <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white">
            <span className="flex flex-1 items-center truncate px-3 py-2 font-mono text-xs text-slate-700">
              {link.url}
            </span>
            <button
              type="button"
              onClick={onCopy}
              className={cn(
                'inline-flex items-center gap-1 border-l border-slate-200 px-3 text-xs font-medium transition-colors',
                copied
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3 w-3" />
              Open preview
            </a>
            <button
              type="button"
              onClick={onRotate}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-3 w-3" />
              Rotate
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Anyone with this link can view a read-only snapshot. Rotate the link to
            revoke previous shares.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Schedule                                                                   */
/* -------------------------------------------------------------------------- */

function ScheduleCard({
  schedule,
  connections,
  onChange,
}: {
  schedule: ScheduleState;
  connections: ProviderId[];
  onChange: (next: ScheduleState) => void;
}) {
  const nextRun = describeNextRun(schedule.frequency);
  const enabled = schedule.frequency !== 'off';
  const availableDestinations: ProviderId[] = useMemo(() => {
    const base: ProviderId[] = ['email', 'sharelink'];
    return [...base, ...connections.filter((c) => !base.includes(c))];
  }, [connections]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FieldLabel label="Frequency">
          <select
            value={schedule.frequency}
            onChange={(e) =>
              onChange({ ...schedule, frequency: e.target.value as ScheduleFrequency })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            {(Object.keys(SCHEDULE_LABELS) as ScheduleFrequency[]).map((freq) => (
              <option key={freq} value={freq}>
                {SCHEDULE_LABELS[freq]}
              </option>
            ))}
          </select>
        </FieldLabel>

        <FieldLabel label="Template">
          <select
            value={schedule.templateId}
            onChange={(e) =>
              onChange({ ...schedule, templateId: e.target.value as TemplateId })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </FieldLabel>

        <FieldLabel label="Send via">
          <select
            value={schedule.destination}
            onChange={(e) =>
              onChange({ ...schedule, destination: e.target.value as ProviderId })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            {availableDestinations.map((d) => (
              <option key={d} value={d}>
                {PROVIDERS[d].name}
              </option>
            ))}
          </select>
        </FieldLabel>

        <FieldLabel label="Recipient / Folder">
          <input
            type="text"
            value={schedule.recipient}
            onChange={(e) => onChange({ ...schedule, recipient: e.target.value })}
            placeholder={
              schedule.destination === 'email' ? 'you@example.com' : '/Expenses'
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 transition-colors hover:border-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </FieldLabel>
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs',
          enabled
            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
            : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'
        )}
      >
        <span className="flex items-center gap-2">
          {enabled ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <CalendarClock className="h-3.5 w-3.5" />
          )}
          {enabled && nextRun
            ? `Next backup: ${nextRun}`
            : 'Recurring backup is currently off'}
        </span>
        {enabled && (
          <span className="font-medium">
            {SCHEDULE_LABELS[schedule.frequency]} · {PROVIDERS[schedule.destination as ProviderId]?.name ?? schedule.destination}
          </span>
        )}
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* History                                                                    */
/* -------------------------------------------------------------------------- */

function HistoryList({ history }: { history: ExportHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
        No exports yet. Send a template above and it&apos;ll appear here.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {history.slice(0, 8).map((entry) => (
        <HistoryItem key={entry.id} entry={entry} />
      ))}
      {history.length > 8 && (
        <li className="bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-400">
          + {history.length - 8} earlier exports
        </li>
      )}
    </ul>
  );
}

function HistoryItem({ entry }: { entry: ExportHistoryEntry }) {
  const Icon =
    entry.destination === 'download'
      ? Download
      : PROVIDER_ICONS[entry.destination as ProviderId];
  const accent =
    entry.destination === 'download'
      ? 'from-slate-400 to-slate-600'
      : PROVIDERS[entry.destination as ProviderId].gradient;

  return (
    <li className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50">
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white',
          accent
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-semibold text-slate-900">
            {entry.templateName}
          </p>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {entry.format}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">
          {entry.destinationName}
          {entry.recipient ? ` · ${entry.recipient}` : ''}
          {' · '}
          {entry.recordCount} record{entry.recordCount === 1 ? '' : 's'}
          {' · '}
          {formatCurrency(entry.totalAmount)}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-slate-400">
          {formatRelativeTime(entry.timestamp)}
        </span>
        {entry.remoteUrl && (
          <a
            href={entry.remoteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-600 hover:text-violet-700"
          >
            Open <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </li>
  );
}
