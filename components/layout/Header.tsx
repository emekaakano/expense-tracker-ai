'use client';

import { Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, subtitle, action, secondaryAction }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} size="md" variant="secondary">
            <Download className="h-4 w-4" />
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button onClick={action.onClick} size="md">
            <Plus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
