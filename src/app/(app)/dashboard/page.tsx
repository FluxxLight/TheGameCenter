'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck2,
  Clock,
  Compass,
  Flame,
  Gamepad2,
  Library,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Trophy,
  UserCircle2,
  Users,
} from 'lucide-react';
import { GameFormModal } from '@/components/library/GameFormModal';
import { GameCover } from '@/components/ui/GameCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import {
  addUserGame,
  computeLibraryStats,
  listUserGames,
} from '@/services/libraryService';
import { UserGame, UserGameInput } from '@/types/database';

function formatBrDate(iso: string | null): string {
  if (!iso) return '';
  const clean = iso.slice(0, 10).split('-');
  if (clean.length !== 3) return iso;
  return `${clean[2]}/${clean[1]}/${clean[0]}`;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { friendsCount, pendingIncomingCount, unreadMessagesCount } = useSocial();
  const { showToast } = useToast();

  const [games, setGames] = useState<UserGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchGames = useCallback(async () => {
    if (!user) return;
    setLoadingGames(true);
    try {
      const list = await listUserGames(user.id);
      setGames(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.',
        'error'
      );
    } finally {
      setLoadingGames(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const stats = useMemo(() => computeLibraryStats(games), [games]);

  const playingGames = useMemo(
    () => games.filter((g) => g.status === 'Jogando').slice(0, 6),
    [games]
  );

  const recentlyAddedGames = useMemo(
    () =>
      [...games]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 6),
    [games]
  );

  const completedGames = useMemo(
    () =>
      games
        .filter((g) => g.status === 'Zerei')
        .sort((a, b) => {
          const da = a.completed_at || a.updated_at;
          const db = b.completed_at || b.updated_at;
          return db.localeCompare(da);
        })
        .slice(0, 6),
    [games]
  );

  const handleAddGame = async (input: UserGameInput) => {
    if (!user) return;
    const created = await addUserGame(user.id, input, games);
    setGames((prev) => [created, ...prev]);
    showToast(`"${created.title}" adicionado à sua biblioteca!`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Hero Command Header */}
      <section className="tgc-glass-panel relative overflow-hidden rounded-3xl border border-cyan-400/25 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Command Center • @{profile?.username || 'jogador'}</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Olá, {profile?.display_name || profile?.username || 'Jogador'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Acompanhe os jogos em andamento, seu histórico de conquistas e as
              estatísticas da sua biblioteca pessoal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Jogo</span>
            </button>
            <Link
              href="/biblioteca"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <Library className="h-4 w-4 text-cyan-300" />
              <span>Minha Biblioteca</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Telemetry Stats Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="tgc-glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total de Jogos
            </span>
            <Gamepad2 className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            {stats.totalGames}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.backlogCount} na fila • {stats.droppedCount} abandonados
          </p>
        </div>

        <div className="tgc-glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Jogando Agora
            </span>
            <Flame className="h-4 w-4 text-cyan-300" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-cyan-300 sm:text-4xl">
            {stats.playingCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Campanhas ativas no momento</p>
        </div>

        <div className="tgc-glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Jogos Zerados
            </span>
            <Trophy className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-300 sm:text-4xl">
            {stats.completedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Taxa de conclusão: {stats.completionRate}%
          </p>
        </div>

        <div className="tgc-glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Horas &amp; Nota Média
            </span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            {stats.totalHours}h
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>
              {stats.averageRating !== null
                ? `Média ${stats.averageRating}/10`
                : 'Sem notas ainda'}
            </span>
          </p>
        </div>
      </section>

      {loadingGames ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-40 animate-pulse rounded-2xl border border-white/10 bg-slate-900/60"
            />
          ))}
        </div>
      ) : games.length === 0 ? (
        /* Empty Library Onboarding State */
        <section className="tgc-glass-panel rounded-3xl border border-dashed border-cyan-400/30 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
            <Gamepad2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white">
            Sua biblioteca gamer está pronta para o primeiro título
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
            Adicione jogos pesquisando no catálogo integrado ou cadastre qualquer jogo
            manualmente para acompanhar horas jogadas, notas e linha do tempo pessoal.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Primeiro Jogo</span>
            </button>
            <Link
              href="/jogos"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-white/10"
            >
              <Compass className="h-4 w-4 text-cyan-300" />
              <span>Explorar Catálogo</span>
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-9">
          {/* 1. Jogando Agora */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="h-5 w-5 text-cyan-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Jogando Agora
                </h2>
              </div>
              <Link
                href="/biblioteca?status=Jogando"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
              >
                <span>Ver todos</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {playingGames.length === 0 ? (
              <div className="tgc-glass-panel rounded-2xl p-6 text-sm text-slate-400">
                Nenhum jogo marcado como <strong className="text-cyan-300">Jogando</strong>{' '}
                no momento. Altere o status de um jogo na sua biblioteca ou adicione um
                novo título!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {playingGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/biblioteca/${game.id}`}
                    className="tgc-glass-panel tgc-card-hover group flex items-center gap-4 rounded-2xl p-3.5"
                  >
                    <GameCover
                      title={game.title}
                      coverUrl={game.cover_url}
                      genre={game.genre}
                      platform={game.platform}
                      className="h-24 w-16 shrink-0 rounded-xl border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <StatusBadge status={game.status} size="sm" />
                      <h3 className="mt-1.5 truncate font-display text-lg font-bold text-white group-hover:text-cyan-300">
                        {game.title}
                      </h3>
                      <p className="truncate text-xs text-slate-400">
                        {game.platform} • {game.genre}
                      </p>
                      <div className="mt-2 flex items-center gap-3 font-mono text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-cyan-400" />
                          {game.hours_played}h
                        </span>
                        {game.rating !== null && (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {game.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 2. Adicionados Recentemente */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Adicionados Recentemente
                </h2>
              </div>
              <Link
                href="/biblioteca"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
              >
                <span>Abrir biblioteca completa</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {recentlyAddedGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/biblioteca/${game.id}`}
                  className="tgc-glass-panel tgc-card-hover group flex flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <GameCover
                      title={game.title}
                      coverUrl={game.cover_url}
                      genre={game.genre}
                      platform={game.platform}
                      className="h-full w-full"
                    />
                    <div className="absolute left-2 top-2">
                      <StatusBadge status={game.status} size="sm" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate font-display text-sm font-bold text-white group-hover:text-cyan-300">
                      {game.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">{game.platform}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 3. Jogos Zerados */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Jogos Zerados
                </h2>
              </div>
              <Link
                href="/biblioteca?status=Zerei"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:underline"
              >
                <span>Ver galeria de zerados</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {completedGames.length === 0 ? (
              <div className="tgc-glass-panel rounded-2xl p-6 text-sm text-slate-400">
                Quando você concluir uma campanha e marcar como{' '}
                <strong className="text-emerald-300">Zerei</strong>, seus troféus de
                conclusão aparecerão aqui.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/biblioteca/${game.id}`}
                    className="tgc-glass-panel tgc-card-hover group flex items-center gap-4 rounded-2xl border-emerald-500/20 p-3.5"
                  >
                    <GameCover
                      title={game.title}
                      coverUrl={game.cover_url}
                      genre={game.genre}
                      platform={game.platform}
                      className="h-24 w-16 shrink-0 rounded-xl border border-emerald-400/25"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status="Zerei" size="sm" />
                        {game.rating !== null && (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-300">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {game.rating.toFixed(1)}/10
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 truncate font-display text-lg font-bold text-white group-hover:text-emerald-300">
                        {game.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{game.hours_played}h</span>
                        {game.completed_at && (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <CalendarCheck2 className="h-3.5 w-3.5" />
                            {formatBrDate(game.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Shortcuts to Library, Profile & Active Social Hub */}
      <section className="border-t border-white/10 pt-6">
        <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-wider text-slate-200">
          Atalhos da Plataforma &amp; Rede Social Gamer
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/biblioteca"
            className="tgc-glass-panel tgc-card-hover flex items-center gap-3.5 rounded-2xl p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-white">
                Minha Biblioteca
              </p>
              <p className="text-xs text-slate-400">Gerenciar coleção e status</p>
            </div>
          </Link>

          <Link
            href="/perfil"
            className="tgc-glass-panel tgc-card-hover flex items-center gap-3.5 rounded-2xl p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-white">
                Perfil &amp; Player Code
              </p>
              <p className="font-mono text-xs text-cyan-300">
                {profile?.player_code || 'Identidade TGC'}
              </p>
            </div>
          </Link>

          <Link
            href="/amigos"
            className="tgc-glass-panel tgc-card-hover flex items-center justify-between gap-3 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold text-white">
                  Amigos ({friendsCount})
                </p>
                <p className="text-xs text-indigo-300">
                  {pendingIncomingCount > 0
                    ? `${pendingIncomingCount} ${pendingIncomingCount === 1 ? 'solicitação pendente' : 'solicitações pendentes'}`
                    : 'Buscar por código único'}
                </p>
              </div>
            </div>
            {pendingIncomingCount > 0 && (
              <span className="rounded-full bg-cyan-400 px-2 py-0.5 font-mono text-xs font-bold text-slate-950 shadow-neon-cyan">
                {pendingIncomingCount}
              </span>
            )}
          </Link>

          <Link
            href="/mensagens"
            className="tgc-glass-panel tgc-card-hover flex items-center justify-between gap-3 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold text-white">
                  Mensagens &amp; Grupos
                </p>
                <p className="text-xs text-purple-300">
                  {unreadMessagesCount > 0
                    ? `${unreadMessagesCount} ${unreadMessagesCount === 1 ? 'nova mensagem' : 'novas mensagens'}`
                    : 'Chats diretos e grupos privados'}
                </p>
              </div>
            </div>
            {unreadMessagesCount > 0 && (
              <span className="rounded-full bg-cyan-400 px-2 py-0.5 font-mono text-xs font-bold text-slate-950 shadow-neon-cyan">
                {unreadMessagesCount}
              </span>
            )}
          </Link>
        </div>
      </section>

      <GameFormModal
        open={addModalOpen}
        existingLibrary={games}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddGame}
      />
    </div>
  );
}
