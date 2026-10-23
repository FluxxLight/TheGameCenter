'use client';

import React, { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';

interface GameCoverProps {
  title: string;
  coverUrl?: string | null;
  genre?: string;
  platform?: string;
  className?: string;
}

const FALLBACK_GRADIENTS = [
  'from-cyan-950 via-slate-900 to-indigo-950',
  'from-indigo-950 via-slate-900 to-purple-950',
  'from-emerald-950 via-slate-900 to-cyan-950',
  'from-rose-950 via-slate-900 to-indigo-950',
  'from-amber-950 via-slate-900 to-slate-950',
];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function GameCover({
  title,
  coverUrl,
  genre,
  platform,
  className = '',
}: GameCoverProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [coverUrl]);

  const trimmedUrl = coverUrl?.trim();
  const showImage = Boolean(trimmedUrl) && !imgFailed;
  const gradient = FALLBACK_GRADIENTS[hashTitle(title) % FALLBACK_GRADIENTS.length];

  if (showImage) {
    return (
      <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
        <img
          src={trimmedUrl}
          alt={`Capa de ${title}`}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden bg-gradient-to-br ${gradient} p-4 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_30%_20%,rgba(0,229,255,0.45),transparent_55%)]" />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="truncate rounded-md border border-white/10 bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
          {platform || 'GAME'}
        </span>
        <Gamepad2 className="h-4 w-4 shrink-0 text-white/40" />
      </div>

      <div className="relative z-10 my-auto py-3 text-center">
        <p className="line-clamp-3 font-display text-lg font-bold leading-tight tracking-wide text-white drop-shadow">
          {title}
        </p>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-2 text-center">
        <span className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-400">
          {genre || 'The Game Center'}
        </span>
      </div>
    </div>
  );
}
