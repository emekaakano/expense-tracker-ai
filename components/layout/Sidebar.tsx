'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/insights', label: 'Insights', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col bg-slate-900 lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-900/30">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="block text-sm font-bold text-white">ExpenseAI</span>
          <span className="block text-xs text-slate-400">Smart Tracking</span>
        </div>
      </div>

      <div className="mx-3 mb-2 border-t border-slate-700/50" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4">
        <div className="rounded-xl bg-slate-800/60 px-4 py-3">
          <p className="text-xs font-medium text-slate-300">Pro Tip</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Use filters to analyze your spending patterns.
          </p>
        </div>
      </div>
    </aside>
  );
}
