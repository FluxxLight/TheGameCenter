'use client';

import React, { useEffect, useState } from 'react';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'h-7 w-7 rounded-lg text-[10px]',
  sm: 'h-9 w-9 rounded-xl text-xs',
  md: 'h-11 w-11 rounded-xl text-sm',
  lg: 'h-14 w-14 rounded-2xl text-lg',
  xl: 'h-20 w-20 rounded-2xl text-2xl',
};

export function PlayerAvatar({
  name,
  avatarUrl,
  size = 'md',
  highlight = false,
  className = '',
}: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  const initials = (name || 'TG').trim().slice(0, 2).toUpperCase();
  const ringClass = highlight
    ? 'border-cyan-400/60 shadow-neon-cyan'
    : 'border-white/15';

  if (avatarUrl?.trim() && !failed) {
    return (
      <img
        src={avatarUrl.trim()}
        alt={name}
        onError={() => setFailed(true)}
        className={`shrink-0 border object-cover ${SIZE_MAP[size]} ${ringClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center border bg-gradient-to-br from-cyan-500/25 via-slate-900 to-indigo-500/35 font-display font-bold uppercase tracking-wider text-cyan-200 ${SIZE_MAP[size]} ${ringClass} ${className}`}
    >
      {initials}
    </div>
  );
}
