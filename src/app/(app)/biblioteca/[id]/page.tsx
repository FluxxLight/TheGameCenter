'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarCheck2,
  Clock,
  Disc3,
  Edit3,
  FileText,
  Flame,
  Gamepad2,
  History,
  PlusCircle,
  RefreshCw,
  Star,
  Trash2,
  Trophy,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/library/ConfirmDialog';
import { GameFormModal } from '@/components/library/GameFormModal';
import { GameCover } from '@/components/ui/GameCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteUserGame,
  getUserGameById,
  listGameEvents,
  listUserGames,
  quickUpdateGameStatus,
  updateUserGame,
} from '@/services/libraryService';
import {
  GAME_STATUSES,
  GameEventType,
  GameStatus,
  UserGame,
  UserGameEvent,
  UserGameInput,
} from '@/types/database';

function formatDateBr(iso: string | null): string {
  if (!iso) return 'Não informada';
  const clean = iso.slice(0, 10).split('-');
  if (clean.length !== 3) return iso;
  return `${clean[2]}/${clean[1]}/${clean[0]}`;
}

function formatDateTimeBr(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getEventIconConfig(type: GameEventType) {
  switch (type) {
    case 'added':
      return {
        Icon: PlusCircle,
        color: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300',
      };
    case 'started_playing':
      return {
        Icon: Flame,
        color: 'border-indigo-400/40 bg-indigo-500/20 text-indigo-300',
      };
    case 'completed':
      return {
        Icon: Trophy,
        color: 'border-emerald-400/45 bg-emerald-500/20 text-emerald-300',
      };
    case 'rating_updated':
      return {
        Icon: Star,
        color: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
      };
    case 'hours_updated':
      return {
        Icon: Clock,
        color: 'border-sky-400/35 bg-sky-500/15 text-sky-300',
      };
    case 'status_changed':
    default:
      return {
        Icon: RefreshCw,
        color: 'border-purple-400/40 bg-purple-500/15 text-purple-300',
      };
  }
}

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const gameId = params?.id;

  const [game, setGame] = useState<UserGame | null>(null);
  const [allGames, setAllGames] = useState<UserGame[]>([]);
  const [events, setEvents] = useState<UserGameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadGameAndTimeline = useCallback(async () => {
    if (!user || !gameId) return;
    setLoading(true);
    try {
      const [foundGame, userLibrary] = await Promise.all([
        getUserGameById(gameId, user.id),
        listUserGames(user.id),
      ]);

      if (!foundGame) {
        setNotFound(true);
        setGame(null);
        return;
      }

      setGame(foundGame);
      setAllGames(userLibrary);
      setNotFound(false);

      const timeline = await listGameEvents(gameId, user.id);
      setEvents(timeline);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar detalhes do jogo.',
        'error'
      );
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [user, gameId, showToast]);

  useEffect(() => {
    loadGameAndTimeline();
  }, [loadGameAndTimeline]);

  const handleStatusChange = async (nextStatus: GameStatus) => {
    if (!user || !game || game.status === nextStatus) return;
    try {
      const updated = await quickUpdateGameStatus(game.id, user.id, nextStatus);
      setGame(updated);
      const refreshedEvents = await listGameEvents(game.id, user.id);
      setEvents(refreshedEvents);
      showToast(`Status alterado para "${nextStatus}".`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao alterar status.',
        'error'
      );
    }
  };

  const handleEditSubmit = async (input: UserGameInput) => {
    if (!user || !game) return;
    const updated = await updateUserGame(game.id, user.id, input, allGames);
    setGame(updated);
    const refreshedEvents = await listGameEvents(game.id, user.id);
    setEvents(refreshedEvents);
    showToast('Ficha do jogo atualizada com sucesso!', 'success');
  };

  const handleDeleteConfirm = async () => {
    if (!user || !game) return;
    setDeleting(true);
    try {
      await deleteUserGame(game.id, user.id);
      showToast(`"${game.title}" foi removido da sua biblioteca.`, 'info');
      router.replace('/biblioteca');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao excluir jogo.',
        'error'
      );
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-slate-900" />
        <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
      </div>
    );
  }

  if (notFound || !game) {
    return (
      <div className="tgc-glass-panel rounded-3xl p-10 text-center">
        <h1 className="font-display text-2xl font-bold uppercase text-white">
          Jogo não encontrado na sua biblioteca
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Este registro não existe ou pertence a outra conta privada.
        </p>
        <Link
          href="/biblioteca"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-5 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Minha Biblioteca</span>
        </Link>
      </div>
    );
  }

  const mediaFormat =
    typeof game.additional_info?.mediaFormat === 'string'
      ? game.additional_info.mediaFormat
      : 'Digital';

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Minha Biblioteca</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editar Jogo</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remover</span>
          </button>
        </div>
      </div>

      {/* Hero Game Showcase Card */}
      <section className="tgc-glass-panel relative overflow-hidden rounded-3xl border border-cyan-500/25 p-6 sm:p-8">
        {game.cover_url && (
          <div
            className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-15 blur-2xl"
            style={{ backgroundImage: `url(${game.cover_url})` }}
          />
        )}

        <div className="relative z-10 flex flex-col gap-7 md:flex-row">
          {/* Cover */}
          <div className="mx-auto w-48 shrink-0 sm:w-56 md:mx-0">
            <GameCover
              title={game.title}
              coverUrl={game.cover_url}
              genre={game.genre}
              platform={game.platform}
              className="aspect-[2/3] w-full rounded-2xl border border-white/20 shadow-panel-elevated"
            />
          </div>

          {/* Primary Info & Telemetry */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge status={game.status} />
                <span className="rounded-full border border-white/15 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {game.platform}
                </span>
                <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                  {game.genre}
                </span>
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl lg:text-5xl">
                {game.title}
              </h1>

              {(game.developer || game.publisher) && (
                <p className="mt-1.5 text-sm text-slate-300">
                  {game.developer && (
                    <span>
                      Desenvolvido por <strong className="text-white">{game.developer}</strong>
                    </span>
                  )}
                  {game.developer && game.publisher ? ' • ' : ''}
                  {game.publisher && <span>Publicado por {game.publisher}</span>}
                </p>
              )}
            </div>

            {/* Key Personal Stats Row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  Sua Nota
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-amber-300">
                  {game.rating !== null ? `${game.rating.toFixed(1)}/10` : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  Horas Jogadas
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  {game.hours_played}h
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                  Data em que Zerou
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-emerald-300 sm:text-base">
                  {game.completed_at ? formatDateBr(game.completed_at) : 'Em aberto'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  Lançamento
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-slate-200 sm:text-base">
                  {formatDateBr(game.release_date)}
                </p>
              </div>
            </div>

            {/* Quick Status Switcher Bar */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Alterar Status Atual (registra automaticamente no seu histórico)
              </p>
              <div className="flex flex-wrap gap-2">
                {GAME_STATUSES.map((st) => {
                  const active = game.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        active
                          ? 'border-cyan-400/70 bg-cyan-500/20 text-white shadow-neon-cyan'
                          : 'border-white/10 bg-slate-900 text-slate-400 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Details: Left = Description, Technical Specs & Notes | Right = Personal Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Game Information */}
        <div className="space-y-6 lg:col-span-7">
          <section className="tgc-glass-panel rounded-2xl p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wider text-white">
              <FileText className="h-5 w-5 text-cyan-400" />
              <span>Descrição do Jogo</span>
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {game.description.trim()
                ? game.description
                : 'Nenhuma sinopse informada ainda. Clique em "Editar Jogo" para adicionar uma descrição personalizada.'}
            </p>
          </section>

          <section className="tgc-glass-panel rounded-2xl p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wider text-white">
              <Gamepad2 className="h-5 w-5 text-indigo-400" />
              <span>Informações Adicionais &amp; Ficha Técnica</span>
            </h2>

            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  Desenvolvedora
                </dt>
                <dd className="mt-1 font-semibold text-white">
                  {game.developer || 'Não informada'}
                </dd>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                  Publicadora
                </dt>
                <dd className="mt-1 font-semibold text-white">
                  {game.publisher || 'Não informada'}
                </dd>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Disc3 className="h-3.5 w-3.5 text-emerald-400" />
                  Mídia / Formato &amp; Origem
                </dt>
                <dd className="mt-1 font-semibold text-white">
                  {mediaFormat} • {game.is_manual ? 'Cadastro Manual' : 'Catálogo TGC'}
                </dd>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  Adicionado à Biblioteca em
                </dt>
                <dd className="mt-1 font-semibold text-white">
                  {formatDateTimeBr(game.created_at)}
                </dd>
              </div>

              {game.started_at && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                  <dt className="text-xs text-slate-400">Início da Jogatina</dt>
                  <dd className="mt-1 font-semibold text-cyan-300">
                    {formatDateBr(game.started_at)}
                  </dd>
                </div>
              )}

              {game.completed_at && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
                  <dt className="text-xs text-slate-400">Campanha Zerada em</dt>
                  <dd className="mt-1 font-semibold text-emerald-300">
                    {formatDateBr(game.completed_at)}
                  </dd>
                </div>
              )}
            </dl>

            {/* Personal Review / Notes */}
            <div className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-950/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Diário &amp; Anotações Pessoais
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {game.personal_notes.trim()
                  ? game.personal_notes
                  : 'Nenhuma anotação pessoal registrada. Use "Editar Jogo" para salvar sua review, builds favoritas ou observações.'}
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Personal Timeline History */}
        <div className="lg:col-span-5">
          <section className="tgc-glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wider text-white">
                <History className="h-5 w-5 text-cyan-400" />
                <span>Histórico Pessoal</span>
              </h2>
              <span className="rounded-full border border-white/10 bg-slate-950 px-2.5 py-0.5 font-mono text-xs text-slate-400">
                {events.length} {events.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Registro automático da sua jornada individual com este jogo.
            </p>

            {events.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Nenhum evento registrado ainda.
              </p>
            ) : (
              <ol className="relative mt-6 space-y-5 border-l border-white/10 pl-6">
                {events.map((ev) => {
                  const { Icon, color } = getEventIconConfig(ev.event_type);
                  return (
                    <li key={ev.id} className="relative">
                      <span
                        className={`absolute -left-[37px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="rounded-xl border border-white/10 bg-slate-950/75 p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-display text-base font-bold text-white">
                            {ev.title}
                          </span>
                          <time className="font-mono text-[11px] text-slate-400">
                            {formatDateTimeBr(ev.occurred_at)}
                          </time>
                        </div>
                        {ev.description && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      <GameFormModal
        open={editModalOpen}
        editingGame={game}
        existingLibrary={allGames}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Excluir Jogo da Biblioteca"
        description={`Tem certeza de que deseja remover "${game.title}" permanentemente da sua biblioteca pessoal?`}
        confirmLabel="Excluir Jogo"
        loading={deleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
