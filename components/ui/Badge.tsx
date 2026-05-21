'use client';

import { Category } from '@/lib/types';
import { CATEGORY_BADGE, CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BadgeProps {
  category: Category;
  showIcon?: boolean;
  className?: string;
}

export function CategoryBadge({ category, showIcon = true, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        CATEGORY_BADGE[category],
        className
      )}
    >
      {showIcon && <span className="text-xs">{CATEGORY_ICONS[category]}</span>}
      {category}
    </span>
  );
}
