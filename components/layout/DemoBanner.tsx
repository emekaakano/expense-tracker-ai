'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'expense-demo-banner-dismissed-v1';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* storage blocked — fine, banner just won't persist */
    }
  }

  if (dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 px-4 py-3 ring-1 ring-violet-100">
      <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
      <div className="flex-1 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Live demo.</span>{' '}
        Sample data is preloaded for exploration. Any changes you make stay in your browser only — feel free to experiment.
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss demo banner"
        className="flex-shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-violet-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
