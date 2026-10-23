import React from 'react';
import { Bookmark, Flame, Trophy, XCircle } from 'lucide-react';
import { GameStatus } from '@/types/database';

interface StatusBadgeProps {
  status: GameStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const STATUS_CONFIG: Record<
  GameStatus,
  {
    label: GameStatus;
    badgeClass: string;
    dotClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Jogando: {
    label: 'Jogando',
    badgeClass:
      'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_14px_-4px_rgba(0,229,255,0.4)]',
    dotClass: 'bg-cyan-400',
    Icon: Flame,
  },
  Zerei: {
    label: 'Zerei',
    badgeClass:
      'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_14px_-4px_rgba(16,185,129,0.4)]',
    dotClass: 'bg-emerald-400',
    Icon: Trophy,
  },
  'Quero Jogar': {
    label: 'Quero Jogar',
    badgeClass:
      'border-indigo-400/40 bg-indigo-500/15 text-indigo-200 shadow-[0_0_14px_-4px_rgba(99,102,241,0.4)]',
    dotClass: 'bg-indigo-400',
    Icon: Bookmark,
  },
  Abandonei: {
    label: 'Abandonei',
    badgeClass: 'border-rose-400/35 bg-rose-500/15 text-rose-200',
    dotClass: 'bg-rose-400',
    Icon: XCircle,
  },
};

export function StatusBadge({
  status,
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Quero Jogar'];
  const { Icon } = cfg;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide backdrop-blur-md ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${cfg.badgeClass} ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{cfg.label}</span>
    </span>
  );
}
