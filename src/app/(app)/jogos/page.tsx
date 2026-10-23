'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Check,
  Compass,
  Filter,
  Flame,
  Gamepad2,
  Info,
  PenLine,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { GameFormModal } from '@/components/library/GameFormModal';
import { GameCover } from '@/components/ui/GameCover';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import {
  addUserGame,
  computeDiscoveryRecommendations,
  listAllCatalogGames,
  listUserGames,
} from '@/services/libraryService';
import { CatalogGame, UserGame, UserGameInput } from '@/types/database';

type OwnershipFilter = 'all' | 'unowned' | 'owned';
type DiscoverySort = 'popular' | 'score' | 'newest' | 'alpha';

export default function ExploreCatalogPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState<CatalogGame[]>([]);
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & useful discovery filters
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('Todos');
  const [platformFilter, setPlatformFilter] = useState('Todas');
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>('all');
  const [sortBy, setSortBy] = useState<DiscoverySort>('popular');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatalogGame, setSelectedCatalogGame] =
    useState<CatalogGame | null>(null);
  const [previewGame, setPreviewGame] = useState<CatalogGame | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [catList, ownList] = await Promise.all([
        listAllCatalogGames(),
        listUserGames(user.id),
      ]);
      setCatalog(catList);
      setUserGames(ownList);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar descoberta de jogos.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ownedMap = useMemo(() => {
    const map = new Map<string, string>();
    userGames.forEach((g) => {
      map.set(g.title.trim().toLowerCase(), g.id);
    });
    return map;
  }, [userGames]);

  const { popular, recommended } = useMemo(
    () => computeDiscoveryRecommendations(catalog, userGames, profile),
    [catalog, userGames, profile]
  );

  const genres = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((c) => {
      if (c.genre) set.add(c.genre);
    });
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [catalog]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((c) => {
      (c.platforms ?? []).forEach((p) => set.add(p));
    });
    return ['Todas', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [catalog]);

  const hasActiveFilters =
    search.trim() !== '' ||
    genreFilter !== 'Todos' ||
    platformFilter !== 'Todas' ||
    ownershipFilter !== 'all';

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = catalog.filter((item) => {
      const isOwned = ownedMap.has(item.title.trim().toLowerCase());
      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'unowned' && isOwned) return false;
      if (genreFilter !== 'Todos' && item.genre !== genreFilter) return false;
      if (
        platformFilter !== 'Todas' &&
        !(item.platforms ?? []).includes(platformFilter)
      ) {
        return false;
      }
      if (q) {
        const tagsStr = (item.tags ?? []).join(' ');
        const hay =
          `${item.title} ${item.developer} ${item.publisher} ${item.genre} ${tagsStr}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.critic_score ?? 0) - (a.critic_score ?? 0);
        case 'newest':
          return (b.release_date || '').localeCompare(a.release_date || '');
        case 'alpha':
          return a.title.localeCompare(b.title, 'pt-BR');
        case 'popular':
        default:
          return (b.popularity_score ?? 0) - (a.popularity_score ?? 0);
      }
    });

    return list;
  }, [
    catalog,
    ownedMap,
    ownershipFilter,
    genreFilter,
    platformFilter,
    search,
    sortBy,
  ]);

  const handleAddSubmit = async (input: UserGameInput) => {
    if (!user) return;
    const created = await addUserGame(user.id, input, userGames);
    setUserGames((prev) => [created, ...prev]);
    showToast(`"${created.title}" adicionado à sua biblioteca!`, 'success');
  };

  const openAddForCatalogItem = (item: CatalogGame) => {
    setPreviewGame(null);
    setSelectedCatalogGame(item);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-cyan-400" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Descoberta de Jogos
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Explore títulos populares, recomendações para o seu perfil e adicione à sua
            biblioteca quando desejar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCatalogGame(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-400/40 bg-indigo-500/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-indigo-100 transition hover:bg-indigo-500/25"
        >
          <PenLine className="h-4 w-4" />
          <span>Cadastro Manual</span>
        </button>
      </div>

      {/* Curated Showcases: Recommended for User + Popular Highlights (shown when not filtering) */}
      {!loading && !hasActiveFilters && (
        <div className="space-y-8">
          {/* 1. Recomendados para Você */}
          <section className="tgc-glass-panel rounded-3xl border border-cyan-400/25 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                    Recomendados para Você
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Sugestões alinhadas ao seu perfil ({profile?.favorite_genre || 'RPG'} •{' '}
                  {profile?.favorite_platform || 'PC'}) e histórico de biblioteca
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8">
              {recommended.slice(0, 8).map((item) => {
                const ownedId = ownedMap.get(item.title.trim().toLowerCase());
                return (
                  <div
                    key={`rec-${item.id}`}
                    className="tgc-card-hover group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewGame(item)}
                      className="relative aspect-[2/3] w-full overflow-hidden text-left"
                    >
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
                    </button>

                    <div className="flex flex-1 flex-col justify-between gap-2 p-2.5">
                      <div>
                        <p className="line-clamp-1 font-display text-sm font-bold text-white">
                          {item.title}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {item.genre}
                        </p>
                      </div>

                      {ownedId ? (
                        <Link
                          href={`/biblioteca/${ownedId}`}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 py-1.5 text-[11px] font-semibold text-emerald-300"
                        >
                          <Check className="h-3 w-3" />
                          <span>Na Coleção</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAddForCatalogItem(item)}
                          className="tgc-btn-primary inline-flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Biblioteca</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Em Alta / Populares */}
          <section>
            <div className="mb-3.5 flex items-center gap-2">
              <Flame className="h-5 w-5 text-cyan-400" />
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                Em Alta na Comunidade Gamer
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {popular.slice(0, 4).map((item, idx) => {
                const ownedId = ownedMap.get(item.title.trim().toLowerCase());
                return (
                  <div
                    key={`pop-${item.id}`}
                    className="tgc-glass-panel tgc-card-hover flex items-center gap-3.5 rounded-2xl p-3.5"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewGame(item)}
                      className="relative shrink-0"
                    >
                      <GameCover
                        title={item.title}
                        coverUrl={item.cover_url}
                        genre={item.genre}
                        platform={item.default_platform}
                        className="h-24 w-16 rounded-xl border border-white/15"
                      />
                      <span className="tgc-btn-primary absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setPreviewGame(item)}
                        className="truncate text-left font-display text-base font-bold text-white hover:text-cyan-300"
                      >
                        {item.title}
                      </button>
                      <p className="truncate text-xs text-slate-400">
                        {item.genre} • {item.developer}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {ownedId ? (
                          <Link
                            href={`/biblioteca/${ownedId}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
                          >
                            <Check className="h-3 w-3" /> Na Biblioteca
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAddForCatalogItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25"
                          >
                            <Plus className="h-3 w-3" /> Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Search & Multi-Filter Discovery Bar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
            Catálogo Completo ({filteredCatalog.length})
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setGenreFilter('Todos');
                setPlatformFilter('Todas');
                setOwnershipFilter('all');
              }}
              className="text-xs font-semibold text-cyan-300 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="tgc-glass-panel flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por título, desenvolvedora, publicadora ou gênero..."
              className="w-full rounded-xl border border-white/10 bg-tgc-input py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-tgc-input px-3 py-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <select
                aria-label="Filtrar por gênero"
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="bg-transparent text-xs text-white outline-none"
              >
                {genres.map((g) => (
                  <option key={g} value={g} className="bg-slate-950">
                    {g === 'Todos' ? 'Gênero: Todos' : g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-tgc-input px-3 py-2 text-xs">
              <Gamepad2 className="h-3.5 w-3.5 text-cyan-400" />
              <select
                aria-label="Filtrar por plataforma"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-transparent text-xs text-white outline-none"
              >
                {platforms.map((p) => (
                  <option key={p} value={p} className="bg-slate-950">
                    {p === 'Todas' ? 'Plataforma: Todas' : p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-tgc-input px-3 py-2 text-xs">
              <select
                aria-label="Filtrar por presença na biblioteca"
                value={ownershipFilter}
                onChange={(e) =>
                  setOwnershipFilter(e.target.value as OwnershipFilter)
                }
                className="bg-transparent text-xs text-white outline-none"
              >
                <option value="all" className="bg-slate-950">
                  Coleção: Todos
                </option>
                <option value="unowned" className="bg-slate-950">
                  Ainda não tenho
                </option>
                <option value="owned" className="bg-slate-950">
                  Já na minha biblioteca
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-tgc-input px-3 py-2 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
              <select
                aria-label="Ordenar jogos"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as DiscoverySort)}
                className="bg-transparent text-xs text-white outline-none"
              >
                <option value="popular" className="bg-slate-950">
                  Mais Populares
                </option>
                <option value="score" className="bg-slate-950">
                  Melhor Avaliados
                </option>
                <option value="newest" className="bg-slate-950">
                  Mais Recentes
                </option>
                <option value="alpha" className="bg-slate-950">
                  Ordem A–Z
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[2/3] animate-pulse rounded-2xl bg-slate-900/60"
              />
            ))}
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="tgc-glass-panel rounded-3xl border border-dashed border-white/15 p-10 text-center">
            <p className="font-display text-2xl font-bold text-white">
              Nenhum jogo encontrado no catálogo com esses filtros
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
              Você pode limpar os filtros ou cadastrar qualquer jogo manualmente na sua
              biblioteca pessoal!
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setGenreFilter('Todos');
                  setPlatformFilter('Todas');
                  setOwnershipFilter('all');
                }}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                Limpar Filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCatalogGame(null);
                  setModalOpen(true);
                }}
                className="tgc-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                <span>Cadastrar Manualmente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredCatalog.map((item) => {
              const ownedId = ownedMap.get(item.title.trim().toLowerCase());
              return (
                <div
                  key={item.id}
                  className="tgc-glass-panel tgc-card-hover group flex flex-col overflow-hidden rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewGame(item)}
                    className="relative aspect-[2/3] w-full overflow-hidden text-left"
                  >
                    <GameCover
                      title={item.title}
                      coverUrl={item.cover_url}
                      genre={item.genre}
                      platform={item.default_platform}
                      className="h-full w-full"
                    />
                    {item.critic_score && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-amber-400/35 bg-black/80 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300 backdrop-blur-md">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(item.critic_score).toFixed(1)}
                      </span>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col justify-between gap-3 p-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => setPreviewGame(item)}
                        className="line-clamp-2 text-left font-display text-base font-bold leading-tight text-white hover:text-cyan-300"
                      >
                        {item.title}
                      </button>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {item.genre}
                      </p>
                      {item.developer && (
                        <p className="truncate text-[10px] text-slate-500">
                          {item.developer}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ownedId ? (
                        <Link
                          href={`/biblioteca/${ownedId}`}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Na Biblioteca</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAddForCatalogItem(item)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-cyan-400/35 bg-cyan-500/15 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adicionar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewGame(item)}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white"
                        title="Ver sinopse e detalhes"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Catalog Game Quick Preview Modal */}
      {previewGame && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="tgc-glass-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-cyan-400/30 p-6 shadow-panel-elevated sm:p-8">
            <button
              type="button"
              onClick={() => setPreviewGame(null)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white"
              aria-label="Fechar detalhes"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col gap-6 sm:flex-row">
              <GameCover
                title={previewGame.title}
                coverUrl={previewGame.cover_url}
                genre={previewGame.genre}
                platform={previewGame.default_platform}
                className="mx-auto aspect-[2/3] w-40 shrink-0 rounded-2xl border border-white/15 sm:mx-0 sm:w-44"
              />

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-3 py-0.5 text-xs font-semibold text-cyan-200">
                      {previewGame.genre}
                    </span>
                    {previewGame.critic_score && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(previewGame.critic_score).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-3xl font-bold text-white">
                    {previewGame.title}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                  {previewGame.developer && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                      {previewGame.developer}
                    </span>
                  )}
                  {previewGame.release_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      {previewGame.release_date.slice(0, 4)}
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-slate-300">
                  {previewGame.description ||
                    ' Clássico disponível no catálogo do The Game Center.'}
                </p>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Plataformas disponíveis
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(previewGame.platforms ?? [previewGame.default_platform]).map(
                      (p) => (
                        <span
                          key={p}
                          className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1 text-xs text-slate-200"
                        >
                          {p}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  {ownedMap.has(previewGame.title.trim().toLowerCase()) ? (
                    <Link
                      href={`/biblioteca/${ownedMap.get(
                        previewGame.title.trim().toLowerCase()
                      )}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-300"
                    >
                      <Check className="h-4 w-4" />
                      <span>Ver na Minha Biblioteca</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAddForCatalogItem(previewGame)}
                      className="tgc-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Adicionar à Minha Biblioteca</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Personal Library Modal */}
      <GameFormModal
        open={modalOpen}
        initialCatalogGame={selectedCatalogGame}
        existingLibrary={userGames}
        onClose={() => {
          setModalOpen(false);
          setSelectedCatalogGame(null);
        }}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
