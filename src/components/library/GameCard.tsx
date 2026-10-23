'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarCheck2, Clock, Edit3, ExternalLink, Star, Trash2 } from 'lucide-react';
import { GameCover } from '@/components/ui/GameCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GAME_STATUSES, GameStatus, UserGame } from '@/types/database';

interface GameCardProps {
  game: UserGame;
  viewMode?: 'grid' | 'list';
  onStatusChange: (game: UserGame, nextStatus: GameStatus) => void;
  onEdit: (game: UserGame) => void;
  onDelete: (game: UserGame) => void;
}

function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const parts = iso.slice(0, 10).split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function GameCard({
  game,
  viewMode = 'grid',
  onStatusChange,
  onEdit,
  onDelete,
}: GameCardProps) {
  const completedFormatted = formatShortDate(game.completed_at);

  if (viewMode === 'list') {
    return (
      <div className="tgc-glass-panel tgc-card-hover group flex flex-col gap-4 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link href={`/biblioteca/${game.id}`} className="shrink-0">
            <GameCover
              title={game.title}
              coverUrl={game.cover_url}
              genre={game.genre}
              platform={game.platform}
              className="h-24 w-16 rounded-xl border border-white/10"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/biblioteca/${game.id}`}
                className="truncate font-display text-lg font-bold tracking-wide text-white transition hover:text-cyan-300"
              >
                {game.title}
              </Link>
              <StatusBadge status={game.status} size="sm" />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="font-medium text-cyan-300/90">{game.platform}</span>
              <span>•</span>
              <span>{game.genre}</span>
              {game.developer && (
                <>
                  <span>•</span>
                  <span className="truncate">{game.developer}</span>
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                {game.hours_played}h
              </span>
              {game.rating !== null && (
                <span className="inline-flex items-center gap-1 font-mono text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {game.rating.toFixed(1)}/10
                </span>
              )}
              {completedFormatted && (
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Zerado em {completedFormatted}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
          <select
            aria-label={`Alterar status de ${game.title}`}
            value={game.status}
            onChange={(e) => onStatusChange(game, e.target.value as GameStatus)}
            className="rounded-xl border border-white/15 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none transition focus:border-cyan-400/60"
          >
            {GAME_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/biblioteca/${game.id}`}
              className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              <span>Detalhes</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => onEdit(game)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Editar jogo"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(game)}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
              title="Excluir da biblioteca"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tgc-glass-panel tgc-card-hover group flex flex-col overflow-hidden rounded-2xl">
      {/* Cover Header */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        <Link href={`/biblioteca/${game.id}`} className="block h-full w-full">
          <GameCover
            title={game.title}
            coverUrl={game.cover_url}
            genre={game.genre}
            platform={game.platform}
            className="h-full w-full"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-3">
          <StatusBadge status={game.status} size="sm" />
          {game.rating !== null && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/35 bg-black/75 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 backdrop-blur-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {game.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent p-3 pt-10">
          <span className="inline-block rounded-md border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            {game.platform}
          </span>
          <Link href={`/biblioteca/${game.id}`} className="pointer-events-auto block">
            <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold leading-snug tracking-wide text-white transition group-hover:text-cyan-300">
              {game.title}
            </h3>
          </Link>
          <p className="truncate text-xs text-slate-400">{game.genre}</p>
        </div>
      </div>

      {/* Card Body & Quick Controls */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 font-mono text-slate-300">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            {game.hours_played}h jogadas
          </span>
          {completedFormatted ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              {completedFormatted}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">
              {game.is_manual ? 'Registro manual' : 'Catálogo TGC'}
            </span>
          )}
        </div>

        <div className="space-y-2 border-t border-white/10 pt-2.5">
          <select
            aria-label={`Alterar status de ${game.title}`}
            value={game.status}
            onChange={(e) => onStatusChange(game, e.target.value as GameStatus)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none transition hover:border-white/25 focus:border-cyan-400/60"
          >
            {GAME_STATUSES.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-1.5">
            <Link
              href={`/biblioteca/${game.id}`}
              className="flex-1 rounded-xl border border-cyan-500/25 bg-cyan-500/10 py-1.5 text-center text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Ver Página
            </Link>
            <button
              type="button"
              onClick={() => onEdit(game)}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Editar jogo"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(game)}
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-300 transition hover:bg-rose-500/20"
              title="Remover jogo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
