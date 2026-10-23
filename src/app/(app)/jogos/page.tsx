'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Compass, PenLine, Plus, Search } from 'lucide-react';
import { GameFormModal } from '@/components/library/GameFormModal';
import { GameCover } from '@/components/ui/GameCover';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import {
  addUserGame,
  listAllCatalogGames,
  listUserGames,
} from '@/services/libraryService';
import { CatalogGame, UserGame, UserGameInput } from '@/types/database';

export default function ExploreCatalogPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [catalog, setCatalog] = useState<CatalogGame[]>([]);
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('Todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatalogGame, setSelectedCatalogGame] =
    useState<CatalogGame | null>(null);

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
        err instanceof Error ? err.message : 'Erro ao carregar catálogo.',
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

  const genres = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((c) => {
      if (c.genre) set.add(c.genre);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((item) => {
      if (genreFilter !== 'Todos' && item.genre !== genreFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.developer} ${item.genre}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [catalog, search, genreFilter]);

  const handleAddSubmit = async (input: UserGameInput) => {
    if (!user) return;
    const created = await addUserGame(user.id, input, userGames);
    setUserGames((prev) => [created, ...prev]);
    showToast(`"${created.title}" adicionado à sua biblioteca!`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-cyan-400" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Explorar Jogos
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Selecione títulos do catálogo base ou cadastre qualquer obra manualmente na
            sua biblioteca.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCatalogGame(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-400/40 bg-indigo-500/20 px-5 py-3 text-xs font-bold uppercase tracking-wider text-indigo-100 transition hover:bg-indigo-500/30"
        >
          <PenLine className="h-4 w-4" />
          <span>Cadastro Manual / Personalizado</span>
        </button>
      </div>

      {/* Search & Genre Filter */}
      <div className="tgc-glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar jogo pelo nome, desenvolvedora ou gênero..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
          />
        </div>

        <select
          aria-label="Filtrar catálogo por gênero"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs font-medium text-white outline-none focus:border-cyan-400/60"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g === 'Todos' ? 'Todos os Gêneros' : g}
            </option>
          ))}
        </select>
      </div>

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
            &ldquo;{search.trim()}&rdquo; não está no catálogo pré-cadastrado
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
            Cadastre este jogo manualmente agora mesmo com capa, plataforma, nota e
            status!
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCatalogGame(null);
              setModalOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Jogo Manualmente</span>
          </button>
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
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <GameCover
                    title={item.title}
                    coverUrl={item.cover_url}
                    genre={item.genre}
                    platform={item.default_platform}
                    className="h-full w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-3 p-3">
                  <div>
                    <h3 className="line-clamp-2 font-display text-base font-bold leading-tight text-white">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {item.genre}
                    </p>
                  </div>

                  {ownedId ? (
                    <Link
                      href={`/biblioteca/${ownedId}`}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Na Biblioteca</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCatalogGame(item);
                        setModalOpen(true);
                      }}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-cyan-400/35 bg-cyan-500/15 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
