'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Filter,
  LayoutGrid,
  Library,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/library/ConfirmDialog';
import { GameCard } from '@/components/library/GameCard';
import { GameFormModal } from '@/components/library/GameFormModal';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import {
  addUserGame,
  deleteUserGame,
  listUserGames,
  quickUpdateGameStatus,
  updateUserGame,
} from '@/services/libraryService';
import {
  GAME_STATUSES,
  GameStatus,
  UserGame,
  UserGameInput,
} from '@/types/database';

type SortOption = 'updated' | 'created' | 'title' | 'rating' | 'hours';

function LibraryContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Controls
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GameStatus | 'Todos'>('Todos');
  const [platformFilter, setPlatformFilter] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [deletingGame, setDeletingGame] = useState<UserGame | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => {
    const paramStatus = searchParams?.get('status');
    if (paramStatus && GAME_STATUSES.includes(paramStatus as GameStatus)) {
      setStatusFilter(paramStatus as GameStatus);
    }
  }, [searchParams]);

  const loadLibrary = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listUserGames(user.id);
      setGames(list);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar biblioteca.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Todos: games.length,
      Jogando: 0,
      Zerei: 0,
      'Quero Jogar': 0,
      Abandonei: 0,
    };
    for (const g of games) {
      counts[g.status] = (counts[g.status] || 0) + 1;
    }
    return counts;
  }, [games]);

  const availablePlatforms = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      if (g.platform) set.add(g.platform);
    });
    return ['Todas', ...Array.from(set).sort()];
  }, [games]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = games.filter((game) => {
      if (statusFilter !== 'Todos' && game.status !== statusFilter) {
        return false;
      }
      if (platformFilter !== 'Todas' && game.platform !== platformFilter) {
        return false;
      }
      if (normalizedQuery) {
        const hay =
          `${game.title} ${game.genre} ${game.platform} ${game.developer}`.toLowerCase();
        if (!hay.includes(normalizedQuery)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'pt-BR');
        case 'rating':
          return (b.rating ?? -1) - (a.rating ?? -1);
        case 'hours':
          return b.hours_played - a.hours_played;
        case 'created':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case 'updated':
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

    return filtered;
  }, [games, query, statusFilter, platformFilter, sortBy]);

  const handleOpenAdd = () => {
    setEditingGame(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (game: UserGame) => {
    setEditingGame(game);
    setFormModalOpen(true);
  };

  const handleSaveGame = async (input: UserGameInput) => {
    if (!user) return;
    if (editingGame) {
      const updated = await updateUserGame(editingGame.id, user.id, input, games);
      setGames((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast(`"${updated.title}" atualizado com sucesso!`, 'success');
    } else {
      const created = await addUserGame(user.id, input, games);
      setGames((prev) => [created, ...prev]);
      showToast(`"${created.title}" adicionado à sua biblioteca!`, 'success');
    }
  };

  const handleQuickStatusChange = async (
    game: UserGame,
    nextStatus: GameStatus
  ) => {
    if (!user || game.status === nextStatus) return;
    try {
      const updated = await quickUpdateGameStatus(game.id, user.id, nextStatus);
      setGames((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast(
        `Status de "${game.title}" alterado para "${nextStatus}".`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao atualizar status.',
        'error'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deletingGame) return;
    setDeletingLoading(true);
    try {
      await deleteUserGame(deletingGame.id, user.id);
      const removedTitle = deletingGame.title;
      setGames((prev) => prev.filter((item) => item.id !== deletingGame.id));
      setDeletingGame(null);
      showToast(`"${removedTitle}" removido da biblioteca.`, 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao remover jogo.',
        'error'
      );
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Library className="h-6 w-6 text-cyan-400" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Minha Biblioteca
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Coleção pessoal isolada • {games.length}{' '}
            {games.length === 1 ? 'jogo registrado' : 'jogos registrados'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Jogo</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['Todos', ...GAME_STATUSES] as const).map((tab) => {
          const active = statusFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-white shadow-neon-cyan'
                  : 'border-white/10 bg-slate-900/75 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  active ? 'bg-cyan-400/25 text-cyan-200' : 'bg-white/5 text-slate-400'
                }`}
              >
                {statusCounts[tab] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, Platform Filter, Sort & View Mode */}
      <div className="tgc-glass-panel flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar na sua biblioteca por nome, gênero, plataforma ou estúdio..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <select
              aria-label="Filtrar por plataforma"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none"
            >
              {availablePlatforms.map((plat) => (
                <option key={plat} value={plat} className="bg-slate-950">
                  {plat === 'Todas' ? 'Plataforma: Todas' : plat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-slate-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <select
              aria-label="Ordenar biblioteca"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs text-white outline-none"
            >
              <option value="updated" className="bg-slate-950">
                Recém-atualizados
              </option>
              <option value="created" className="bg-slate-950">
                Adicionados por último
              </option>
              <option value="title" className="bg-slate-950">
                Ordem Alfabética (A–Z)
              </option>
              <option value="rating" className="bg-slate-950">
                Maior Nota
              </option>
              <option value="hours" className="bg-slate-950">
                Mais Horas Jogadas
              </option>
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/85 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Games Display */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((skeleton) => (
            <div
              key={skeleton}
              className="aspect-[3/5] animate-pulse rounded-2xl border border-white/10 bg-slate-900/60"
            />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="tgc-glass-panel rounded-3xl border border-dashed border-cyan-400/30 p-10 text-center">
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Sua biblioteca está vazia
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Clique em <strong className="text-cyan-300">Adicionar Jogo</strong> para
            pesquisar um título pelo nome ou cadastrar manualmente qualquer obra.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Jogo Agora</span>
          </button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="tgc-glass-panel rounded-2xl p-8 text-center">
          <p className="font-display text-xl font-bold text-white">
            Nenhum jogo corresponde aos filtros selecionados
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStatusFilter('Todos');
              setPlatformFilter('Todas');
            }}
            className="mt-3 text-xs font-semibold text-cyan-300 hover:underline"
          >
            Limpar filtros de busca
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              viewMode="list"
              onStatusChange={handleQuickStatusChange}
              onEdit={handleOpenEdit}
              onDelete={(target) => setDeletingGame(target)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              viewMode="grid"
              onStatusChange={handleQuickStatusChange}
              onEdit={handleOpenEdit}
              onDelete={(target) => setDeletingGame(target)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <GameFormModal
        open={formModalOpen}
        editingGame={editingGame}
        existingLibrary={games}
        onClose={() => {
          setFormModalOpen(false);
          setEditingGame(null);
        }}
        onSubmit={handleSaveGame}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingGame)}
        title="Remover da Biblioteca"
        description={
          deletingGame
            ? `Tem certeza de que deseja remover "${deletingGame.title}" e todo o seu histórico pessoal da sua biblioteca? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Remover Jogo"
        loading={deletingLoading}
        onCancel={() => setDeletingGame(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function MyLibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-slate-900/50" />
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
