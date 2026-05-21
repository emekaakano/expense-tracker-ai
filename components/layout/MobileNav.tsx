'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-100 bg-white/95 backdrop-blur-md lg:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-6 py-1 text-xs font-medium transition-colors',
              active ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'text-violet-600')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
