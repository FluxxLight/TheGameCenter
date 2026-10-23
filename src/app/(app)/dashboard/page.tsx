'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bookmark,
  Check,
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
  UserPlus,
  Users,
} from 'lucide-react';
import { GameFormModal } from '@/components/library/GameFormModal';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import { GameCover } from '@/components/ui/GameCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import {
  addUserGame,
  computeDiscoveryRecommendations,
  computeLibraryStats,
  listAllCatalogGames,
  listUserGames,
} from '@/services/libraryService';
import { CatalogGame, UserGame, UserGameInput } from '@/types/database';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const {
    friends,
    incomingRequests,
    conversations,
    pendingIncomingCount,
    unreadMessagesCount,
  } = useSocial();
  const { showToast } = useToast();

  const [games, setGames] = useState<UserGame[]>([]);
  const [catalog, setCatalog] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatalogGame, setSelectedCatalogGame] =
    useState<CatalogGame | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userList, catalogList] = await Promise.all([
        listUserGames(user.id),
        listAllCatalogGames(),
      ]);
      setGames(userList);
      setCatalog(catalogList);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar dados da Home.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => computeLibraryStats(games), [games]);

  const playingGames = useMemo(
    () =>
      [...games]
        .filter((g) => g.status === 'Jogando')
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 4),
    [games]
  );

  const completedGames = useMemo(
    () =>
      [...games]
        .filter((g) => g.status === 'Zerei')
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 4),
    [games]
  );

  const recentlyAdded = useMemo(
    () =>
      [...games]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5),
    [games]
  );

  const { recommended } = useMemo(
    () => computeDiscoveryRecommendations(catalog, games, profile),
    [catalog, games, profile]
  );

  const ownedTitles = useMemo(
    () => new Set(games.map((g) => g.title.trim().toLowerCase())),
    [games]
  );

  const handleAddGame = async (input: UserGameInput) => {
    if (!user) return;
    const created = await addUserGame(user.id, input, games);
    setGames((prev) => [created, ...prev]);
    showToast(`"${created.title}" adicionado à sua biblioteca!`, 'success');
  };

  const displayName =
    profile?.display_name || profile?.username || 'Jogador';

  return (
    <div className="space-y-8">
      {/* Compact Welcome Hero */}
      <section className="tgc-glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-[85px]"
        />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Central do Jogador • {profile?.player_code || 'TGC'}</span>
            </div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Bem-vindo, <span className="text-cyan-300">{displayName}</span>
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Acompanhe seus jogos em andamento, conquistas concluídas, conversas com
              amigos e recomendações sob medida.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedCatalogGame(null);
                setModalOpen(true);
              }}
              className="tgc-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Adicionar Jogo</span>
            </button>
            <Link
              href="/jogos"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-100 transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>Descobrir Jogos</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 1. Estatísticas */}
      <section aria-label="Estatísticas da biblioteca">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            href="/biblioteca"
            className="tgc-glass-panel tgc-card-hover rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Biblioteca</span>
              <Library className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-white">
              {loading ? '...' : stats.totalGames}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Jogos cadastrados</p>
          </Link>

          <Link
            href="/biblioteca"
            className="tgc-glass-panel tgc-card-hover rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Jogando</span>
              <Gamepad2 className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-cyan-300">
              {loading ? '...' : stats.playingCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Em andamento</p>
          </Link>

          <Link
            href="/biblioteca"
            className="tgc-glass-panel tgc-card-hover rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Concluídos</span>
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-emerald-300">
              {loading ? '...' : stats.completedCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Status Zerei</p>
          </Link>

          <Link
            href="/biblioteca"
            className="tgc-glass-panel tgc-card-hover rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Fila</span>
              <Bookmark className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-indigo-300">
              {loading ? '...' : stats.backlogCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Quero Jogar</p>
          </Link>

          <div className="tgc-glass-panel col-span-2 rounded-2xl p-4 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tempo Total</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-amber-300">
              {loading ? '...' : `${stats.totalHours.toFixed(1)}h`}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {stats.averageRating !== null
                ? `Média ${stats.averageRating}/10`
                : 'Horas acumuladas'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Balanced Workspace */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-12">
        {/* Left Primary Column (8 cols): Jogando, Concluídos, Adicionados Recentemente */}
        <div className="space-y-7 xl:col-span-8">
          {/* 2. Jogos em Andamento */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-cyan-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Jogos em Andamento
                </h2>
              </div>
              <Link
                href="/biblioteca"
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
              >
                <span>Ver biblioteca</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-28 animate-pulse rounded-2xl border border-white/10 bg-slate-900/50"
                  />
                ))}
              </div>
            ) : playingGames.length === 0 ? (
              <div className="tgc-glass-panel rounded-2xl border border-dashed border-white/15 p-6 text-center">
                <p className="text-sm font-medium text-slate-200">
                  Nenhum jogo marcado como &quot;Jogando&quot; no momento.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Marque um título como &quot;Jogando&quot; para acompanhar progresso e horas aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {playingGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/biblioteca/${game.id}`}
                    className="tgc-glass-panel tgc-card-hover flex items-center gap-3.5 rounded-2xl p-3.5"
                  >
                    <GameCover
                      title={game.title}
                      coverUrl={game.cover_url}
                      genre={game.genre}
                      platform={game.platform}
                      className="h-24 w-16 shrink-0 rounded-xl border border-white/15"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <h3 className="truncate font-display text-lg font-bold text-white">
                          {game.title}
                        </h3>
                        <p className="truncate text-xs text-slate-400">
                          {game.platform} • {game.genre}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <StatusBadge status={game.status} size="sm" />
                        <span className="font-mono text-xs font-semibold text-cyan-300">
                          {Number(game.hours_played || 0)}h jogadas
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 3. Jogos Concluídos & 4. Adicionados Recentemente side-by-side */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Jogos Concluídos */}
            <section className="tgc-glass-panel flex flex-col justify-between rounded-2xl p-5">
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                      Jogos Concluídos
                    </h2>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300">
                    {stats.completedCount}
                  </span>
                </div>

                {completedGames.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Seus jogos finalizados (&quot;Zerei&quot;) aparecerão em destaque aqui.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {completedGames.map((game) => (
                      <Link
                        key={game.id}
                        href={`/biblioteca/${game.id}`}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 transition hover:border-emerald-400/40"
                      >
                        <GameCover
                          title={game.title}
                          coverUrl={game.cover_url}
                          genre={game.genre}
                          platform={game.platform}
                          className="h-12 w-9 shrink-0 rounded-lg border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold text-white">
                            {game.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {game.platform} • {Number(game.hours_played || 0)}h
                          </p>
                        </div>
                        {game.rating !== null && (
                          <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            {Number(game.rating).toFixed(1)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/perfil"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:underline"
              >
                <span>Ver mural completo no Perfil</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            {/* Adicionados Recentemente */}
            <section className="tgc-glass-panel flex flex-col justify-between rounded-2xl p-5">
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                      Adicionados Recentes
                    </h2>
                  </div>
                </div>

                {recentlyAdded.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Adicione seu primeiro jogo para inaugurar sua biblioteca!
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {recentlyAdded.slice(0, 4).map((game) => (
                      <Link
                        key={game.id}
                        href={`/biblioteca/${game.id}`}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 transition hover:border-cyan-400/40"
                      >
                        <GameCover
                          title={game.title}
                          coverUrl={game.cover_url}
                          genre={game.genre}
                          platform={game.platform}
                          className="h-12 w-9 shrink-0 rounded-lg border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold text-white">
                            {game.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {game.platform}
                          </p>
                        </div>
                        <StatusBadge status={game.status} size="sm" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/biblioteca"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
              >
                <span>Abrir biblioteca completa</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          </div>
        </div>

        {/* Right Social Column (4 cols): 5. Amigos & 6. Mensagens */}
        <div className="space-y-6 xl:col-span-4">
          {/* 5. Amigos */}
          <section className="tgc-glass-panel rounded-2xl p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                  Amigos
                </h2>
                {pendingIncomingCount > 0 && (
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                    {pendingIncomingCount} pedido(s)
                  </span>
                )}
              </div>
              <Link
                href="/amigos"
                className="text-xs font-semibold text-cyan-300 hover:underline"
              >
                Gerenciar
              </Link>
            </div>

            {incomingRequests.length > 0 && (
              <Link
                href="/amigos"
                className="mb-3 flex items-center justify-between rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-500/20"
              >
                <span>
                  Você tem {incomingRequests.length} solicitação(ões) pendente(s)
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {friends.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                <p className="text-xs text-slate-300">
                  Conecte-se com outros jogadores por @username ou Player ID.
                </p>
                <Link
                  href="/amigos"
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Adicionar Amigos</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.slice(0, 4).map((f) => (
                  <Link
                    key={f.friendship_id}
                    href="/amigos"
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 transition hover:border-cyan-400/35"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PlayerAvatar
                        name={f.user.display_name || f.user.username}
                        avatarUrl={f.user.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">
                          {f.user.display_name || f.user.username}
                        </p>
                        <p className="truncate text-[11px] text-cyan-300">
                          @{f.user.username}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">
                      {f.user.favorite_platform}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 6. Mensagens */}
          <section className="tgc-glass-panel rounded-2xl p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                  Mensagens
                </h2>
                {unreadMessagesCount > 0 && (
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                    {unreadMessagesCount} nova(s)
                  </span>
                )}
              </div>
              <Link
                href="/mensagens"
                className="text-xs font-semibold text-cyan-300 hover:underline"
              >
                Abrir Chat
              </Link>
            </div>

            {conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                <p className="text-xs text-slate-300">
                  Nenhuma conversa ativa ainda. Crie um grupo privado ou envie uma DM!
                </p>
                <Link
                  href="/mensagens"
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Ir para Mensagens</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.slice(0, 4).map((conv) => {
                  const counterpart = conv.participants.find(
                    (p) => p.id !== user?.id
                  );
                  const title =
                    conv.kind === 'group'
                      ? conv.name || 'Grupo Privado'
                      : counterpart?.display_name ||
                        counterpart?.username ||
                        'Conversa Direta';
                  return (
                    <Link
                      key={conv.id}
                      href={`/mensagens?c=${conv.id}`}
                      className="flex items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-slate-950/60 p-2.5 transition hover:border-cyan-400/35"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-white">
                            {title}
                          </span>
                          {conv.kind === 'group' && (
                            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-300">
                              Grupo
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {conv.last_message_preview || 'Sem mensagens ainda'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="tgc-btn-primary flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 7. Jogos Populares e Recomendados */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                Recomendados &amp; Populares
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Sugestões do catálogo do The Game Center para expandir sua coleção
            </p>
          </div>
          <Link
            href="/jogos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
          >
            <span>Explorar todos os jogos</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {recommended.slice(0, 6).map((item) => {
            const isOwned = ownedTitles.has(item.title.trim().toLowerCase());
            return (
              <div
                key={item.id}
                className="tgc-glass-panel tgc-card-hover flex flex-col overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <GameCover
                    title={item.title}
                    coverUrl={item.cover_url}
                    genre={item.genre}
                    platform={item.default_platform}
                    className="h-full w-full"
                  />
                  {item.critic_score && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-md border border-amber-400/35 bg-black/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {Number(item.critic_score).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between gap-2.5 p-3">
                  <div>
                    <h3 className="line-clamp-1 font-display text-sm font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="truncate text-[11px] text-slate-400">
                      {item.genre}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isOwned}
                    onClick={() => {
                      setSelectedCatalogGame(item);
                      setModalOpen(true);
                    }}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-semibold transition ${
                      isOwned
                        ? 'cursor-default border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                        : 'border border-cyan-400/35 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                    }`}
                  >
                    {isOwned ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Na Coleção</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Biblioteca</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <GameFormModal
        open={modalOpen}
        initialCatalogGame={selectedCatalogGame}
        existingLibrary={games}
        onClose={() => {
          setModalOpen(false);
          setSelectedCatalogGame(null);
        }}
        onSubmit={handleAddGame}
      />
    </div>
  );
}
