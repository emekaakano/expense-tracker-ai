'use client';

import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  topAccent?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  footer,
  topAccent,
}: DrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      document.addEventListener('keydown', onKey);
      return () => {
        cancelAnimationFrame(id);
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      };
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div
        className={cn(
          'absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl',
          'transition-transform duration-300 ease-out',
          visible ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {topAccent}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            )}
            {subtitle && (
              <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-t border-slate-200 bg-white px-6 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
