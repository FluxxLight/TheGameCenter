'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Fingerprint,
  Gamepad2,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import { useToast } from '@/components/ui/ToastProvider';
import { PublicPlayerProfile, RelationshipStatus } from '@/types/social';

interface PlayerSummaryModalProps {
  open: boolean;
  player: PublicPlayerProfile | null;
  relationshipStatus?: RelationshipStatus;
  onClose: () => void;
  onSendRequest?: () => Promise<void> | void;
  onAcceptRequest?: () => Promise<void> | void;
  onDeclineRequest?: () => Promise<void> | void;
  onOpenChat?: () => Promise<void> | void;
  onRemoveFriend?: () => Promise<void> | void;
}

export function PlayerSummaryModal({
  open,
  player,
  relationshipStatus,
  onClose,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onOpenChat,
  onRemoveFriend,
}: PlayerSummaryModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open || !player) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(player.player_code);
      setCopied(true);
      showToast(`Código ${player.player_code} copiado!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(`Código: ${player.player_code}`, 'info');
    }
  };

  const runAction = async (fn?: () => Promise<void> | void) => {
    if (!fn) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="tgc-glass-panel relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/30 shadow-panel-elevated">
        {/* Decorative Header Banner */}
        <div className="h-24 bg-gradient-to-r from-cyan-500/25 via-indigo-600/25 to-purple-600/25" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/15 bg-slate-950/75 p-2 text-slate-300 transition hover:text-white"
          aria-label="Fechar perfil"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <PlayerAvatar
              name={player.display_name || player.username}
              avatarUrl={player.avatar_url}
              size="xl"
              highlight
              className="ring-4 ring-slate-950"
            />

            {relationshipStatus === 'friends' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                <UserCheck className="h-3.5 w-3.5" />
                Amigos
              </span>
            )}
            {relationshipStatus === 'outgoing_pending' && (
              <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                Solicitação Pendente
              </span>
            )}
            {relationshipStatus === 'incoming_pending' && (
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                Enviou convite a você
              </span>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-display text-2xl font-bold text-white">
              {player.display_name || player.username}
            </h3>
            <p className="text-sm font-medium text-cyan-300">@{player.username}</p>
          </div>

          {/* Player Code Box */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-sm font-bold tracking-wider text-slate-100">
                {player.player_code}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar ID</span>
                </>
              )}
            </button>
          </div>

          {/* Preferences */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Gamepad2 className="h-3 w-3 text-cyan-400" />
                Plataforma
              </span>
              <p className="mt-1 truncate text-xs font-semibold text-white">
                {player.favorite_platform || 'PC'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Gênero Favorito
              </span>
              <p className="mt-1 truncate text-xs font-semibold text-white">
                {player.favorite_genre || 'RPG'}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Bio Gamer
            </span>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {player.bio?.trim()
                ? player.bio
                : 'Este jogador ainda não adicionou uma biografia personalizada.'}
            </p>
          </div>

          {/* Contextual Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {relationshipStatus === 'none' && onSendRequest && (
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(onSendRequest)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                <span>Enviar Solicitação</span>
              </button>
            )}

            {relationshipStatus === 'incoming_pending' && (
              <>
                {onAcceptRequest && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(onAcceptRequest)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    <span>Aceitar</span>
                  </button>
                )}
                {onDeclineRequest && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(onDeclineRequest)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    <span>Recusar</span>
                  </button>
                )}
              </>
            )}

            {relationshipStatus === 'friends' && (
              <>
                {onOpenChat && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(onOpenChat)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Enviar Mensagem</span>
                  </button>
                )}
                {onRemoveFriend && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(onRemoveFriend)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    <UserMinus className="h-4 w-4" />
                    <span>Remover</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
