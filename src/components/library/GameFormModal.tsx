'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  ImagePlus,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { GameCover } from '@/components/ui/GameCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { validateGameInput } from '@/lib/validation/gameValidation';
import { searchCatalogGames } from '@/services/libraryService';
import {
  CatalogGame,
  COMMON_GENRES,
  COMMON_PLATFORMS,
  GAME_STATUSES,
  GameStatus,
  UserGame,
  UserGameInput,
} from '@/types/database';

interface GameFormModalProps {
  open: boolean;
  editingGame?: UserGame | null;
  initialCatalogGame?: CatalogGame | null;
  existingLibrary: Pick<UserGame, 'id' | 'title' | 'catalog_game_id'>[];
  onClose: () => void;
  onSubmit: (input: UserGameInput) => Promise<void>;
}

type ModalStep = 'search' | 'form';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido.'));
      img.onload = () => {
        const maxWidth = 480;
        const maxHeight = 720;
        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function GameFormModal({
  open,
  editingGame = null,
  initialCatalogGame = null,
  existingLibrary,
  onClose,
  onSubmit,
}: GameFormModalProps) {
  const isEditing = Boolean(editingGame);

  const [step, setStep] = useState<ModalStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<CatalogGame[]>([]);
  const [searchingCatalog, setSearchingCatalog] = useState(false);

  // Form fields
  const [catalogGameId, setCatalogGameId] = useState<string | null>(null);
  const [isManual, setIsManual] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [genre, setGenre] = useState('RPG de Ação');
  const [platform, setPlatform] = useState('PC');
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [status, setStatus] = useState<GameStatus>('Jogando');
  const [ratingInput, setRatingInput] = useState<string>('');
  const [hoursInput, setHoursInput] = useState<string>('0');
  const [completedAt, setCompletedAt] = useState<string>('');
  const [developer, setDeveloper] = useState('');
  const [publisher, setPublisher] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [mediaFormat, setMediaFormat] = useState<'Digital' | 'Física' | 'Assinatura'>('Digital');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const populateFromCatalog = (item: CatalogGame) => {
    setCatalogGameId(item.id);
    setIsManual(false);
    setTitle(item.title);
    setCoverUrl(item.cover_url ?? '');
    setGenre(item.genre || 'Ação');
    setPlatform(item.default_platform || item.platforms?.[0] || 'PC');
    setAvailablePlatforms(item.platforms ?? []);
    setStatus('Jogando');
    setRatingInput('');
    setHoursInput('0');
    setCompletedAt('');
    setDeveloper(item.developer ?? '');
    setPublisher(item.publisher ?? '');
    setReleaseDate(item.release_date ?? '');
    setDescription(item.description ?? '');
    setPersonalNotes('');
    setMediaFormat('Digital');
    setErrors({});
    setSubmitError(null);
    setStep('form');
  };

  const switchToManual = (prefillTitle?: string) => {
    setCatalogGameId(null);
    setIsManual(true);
    setTitle(prefillTitle !== undefined ? prefillTitle : searchQuery);
    setCoverUrl('');
    setGenre('Ação e Aventura');
    setPlatform('PC');
    setAvailablePlatforms([]);
    setStatus('Jogando');
    setRatingInput('');
    setHoursInput('0');
    setCompletedAt('');
    setDeveloper('');
    setPublisher('');
    setReleaseDate('');
    setDescription('');
    setPersonalNotes('');
    setMediaFormat('Digital');
    setErrors({});
    setSubmitError(null);
    setStep('form');
  };

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setSubmitError(null);

    if (editingGame) {
      setStep('form');
      setCatalogGameId(editingGame.catalog_game_id);
      setIsManual(editingGame.is_manual);
      setTitle(editingGame.title);
      setCoverUrl(editingGame.cover_url ?? '');
      setGenre(editingGame.genre);
      setPlatform(editingGame.platform);
      setAvailablePlatforms([]);
      setStatus(editingGame.status);
      setRatingInput(
        editingGame.rating !== null && editingGame.rating !== undefined
          ? String(editingGame.rating)
          : ''
      );
      setHoursInput(String(editingGame.hours_played ?? 0));
      setCompletedAt(editingGame.completed_at ?? '');
      setDeveloper(editingGame.developer ?? '');
      setPublisher(editingGame.publisher ?? '');
      setReleaseDate(editingGame.release_date ?? '');
      setDescription(editingGame.description ?? '');
      setPersonalNotes(editingGame.personal_notes ?? '');
      const fmt = editingGame.additional_info?.mediaFormat;
      if (fmt === 'Física' || fmt === 'Assinatura' || fmt === 'Digital') {
        setMediaFormat(fmt);
      } else {
        setMediaFormat('Digital');
      }
      return;
    }

    if (initialCatalogGame) {
      populateFromCatalog(initialCatalogGame);
      return;
    }

    setStep('search');
    setSearchQuery('');
  }, [open, editingGame, initialCatalogGame]);

  useEffect(() => {
    if (!open || step !== 'search' || isEditing) return;

    let cancelled = false;
    setSearchingCatalog(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchCatalogGames(searchQuery);
        if (!cancelled) {
          setCatalogResults(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setSearchingCatalog(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, step, searchQuery, isEditing]);

  const existingTitleSet = useMemo(
    () => new Set(existingLibrary.map((g) => g.title.trim().toLowerCase())),
    [existingLibrary]
  );

  if (!open) return null;

  const handleStatusSelect = (nextStatus: GameStatus) => {
    setStatus(nextStatus);
    if (nextStatus === 'Zerei' && !completedAt) {
      setCompletedAt(todayIsoDate());
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setCoverUrl(dataUrl);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.cover_url;
        return copy;
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Erro ao carregar arquivo de capa.'
      );
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsedRating =
      ratingInput.trim() === '' ? null : Number(ratingInput.replace(',', '.'));
    const parsedHours =
      hoursInput.trim() === '' ? 0 : Number(hoursInput.replace(',', '.'));

    const candidateInput: UserGameInput = {
      catalog_game_id: catalogGameId,
      is_manual: isManual,
      title,
      cover_url: coverUrl.trim() || null,
      genre,
      platform,
      status,
      rating: parsedRating,
      hours_played: parsedHours,
      completed_at: completedAt.trim() || null,
      description,
      developer,
      publisher,
      release_date: releaseDate.trim() || null,
      personal_notes: personalNotes,
      additional_info: {
        ...(editingGame?.additional_info ?? {}),
        mediaFormat,
      },
    };

    const validation = validateGameInput(
      candidateInput,
      existingLibrary,
      editingGame?.id
    );

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(candidateInput);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Não foi possível salvar o jogo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="tgc-glass-panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cyan-500/25 shadow-panel-elevated">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-tgc-primary shadow-neon-cyan" />
              <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white sm:text-2xl">
                {isEditing ? 'Editar Jogo da Biblioteca' : 'Adicionar Jogo à Biblioteca'}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {isEditing
                ? 'Atualize status, nota, horas jogadas ou metadados pessoais.'
                : 'Pesquise no catálogo integrado ou cadastre qualquer título manualmente.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (only when creating) */}
        {!isEditing && (
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-slate-900/60 px-5 py-2.5 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('search')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  step === 'search'
                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Pesquisar Jogo</span>
              </button>
              <button
                type="button"
                onClick={() => switchToManual(title || searchQuery)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  step === 'form' && isManual
                    ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>Cadastro Manual</span>
              </button>
            </div>

            {step === 'form' && !isManual && (
              <span className="hidden items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 sm:inline-flex">
                <Sparkles className="h-3 w-3" /> Selecionado do Catálogo
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 'search' && !isEditing ? (
            <div className="space-y-5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome do jogo (ex: Elden Ring, Chrono Trigger, Hollow Knight...)"
                  autoFocus
                  className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              {/* Direct Manual Registration Banner — always available */}
              <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-indigo-500/25 bg-indigo-950/25 px-4 py-3 sm:flex-row sm:items-center">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-indigo-300">
                    Jogo indie, retrô, mod ou fora da lista?
                  </span>{' '}
                  Você pode registrar qualquer obra manualmente sem depender de API externa.
                </div>
                <button
                  type="button"
                  onClick={() => switchToManual(searchQuery)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {searchQuery.trim()
                      ? `Cadastrar "${searchQuery.trim().slice(0, 28)}" manualmente`
                      : 'Ir para Cadastro Manual'}
                  </span>
                </button>
              </div>

              {/* Search Results */}
              {searchingCatalog ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((skeleton) => (
                    <div
                      key={skeleton}
                      className="h-24 animate-pulse rounded-xl border border-white/5 bg-slate-900/70"
                    />
                  ))}
                </div>
              ) : catalogResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-8 text-center">
                  <p className="font-display text-lg font-bold text-white">
                    Nenhum resultado no catálogo para &ldquo;{searchQuery.trim()}&rdquo;
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                    Sem problema! Clique abaixo para cadastrar{' '}
                    <strong className="text-slate-200">{searchQuery.trim()}</strong>{' '}
                    manualmente na sua biblioteca pessoal com todos os detalhes.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchToManual(searchQuery)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-neon-cyan transition hover:brightness-110"
                  >
                    <PenLine className="h-4 w-4" />
                    <span>Cadastrar &ldquo;{searchQuery.trim()}&rdquo; Manualmente</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {searchQuery.trim()
                        ? `Resultados encontrados (${catalogResults.length})`
                        : 'Sugestões em destaque no catálogo'}
                    </span>
                    <span>Clique para selecionar</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {catalogResults.map((item) => {
                      const alreadyOwned = existingTitleSet.has(
                        item.title.trim().toLowerCase()
                      );
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={alreadyOwned}
                          onClick={() => populateFromCatalog(item)}
                          className={`group flex items-center gap-3.5 rounded-xl border p-2.5 text-left transition ${
                            alreadyOwned
                              ? 'cursor-not-allowed border-emerald-500/25 bg-emerald-950/15 opacity-70'
                              : 'border-white/10 bg-slate-900/75 hover:border-cyan-400/50 hover:bg-slate-900'
                          }`}
                        >
                          <GameCover
                            title={item.title}
                            coverUrl={item.cover_url}
                            genre={item.genre}
                            platform={item.default_platform}
                            className="h-20 w-14 shrink-0 rounded-lg border border-white/10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-base font-bold text-white group-hover:text-cyan-300">
                              {item.title}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {item.genre} {item.developer ? `• ${item.developer}` : ''}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                                {item.default_platform}
                              </span>
                              {item.release_date && (
                                <span className="text-[10px] text-slate-500">
                                  {item.release_date.slice(0, 4)}
                                </span>
                              )}
                              {alreadyOwned && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  <Check className="h-3 w-3" /> Já na biblioteca
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Form Step */
            <form id="tgc-game-form" onSubmit={handleFormSubmit} className="space-y-6">
              {submitError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
                  {submitError}
                </div>
              )}

              {/* Top Section: Cover Preview + Core Identity */}
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex shrink-0 flex-col items-center gap-2 sm:w-36">
                  <GameCover
                    title={title || 'Novo Jogo'}
                    coverUrl={coverUrl}
                    genre={genre}
                    platform={platform}
                    className="aspect-[2/3] w-32 rounded-xl border border-white/15 shadow-lg sm:w-36"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-white">
                    <ImagePlus className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Enviar Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Nome do Jogo */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Nome do Jogo <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      placeholder="Título oficial ou personalizado do jogo"
                      className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-rose-400">{errors.title}</p>
                    )}
                  </div>

                  {/* URL da Capa */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      URL da Capa{' '}
                      <span className="font-normal normal-case text-slate-500">
                        (opcional — ou envie imagem ao lado)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={coverUrl.startsWith('data:') ? '' : coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder={
                        coverUrl.startsWith('data:')
                          ? 'Imagem enviada do dispositivo (clique ao lado para trocar)'
                          : 'https://exemplo.com/capa-do-jogo.jpg'
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                    />
                    {coverUrl.startsWith('data:') && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="mt-1 text-[11px] text-rose-400 hover:underline"
                      >
                        Remover imagem enviada
                      </button>
                    )}
                    {errors.cover_url && (
                      <p className="mt-1 text-xs text-rose-400">{errors.cover_url}</p>
                    )}
                  </div>

                  {/* Gênero & Plataforma */}
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Gênero <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        list="tgc-genre-options"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="Ex: RPG de Ação, Metroidvania..."
                        className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
                      />
                      <datalist id="tgc-genre-options">
                        {COMMON_GENRES.map((g) => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                      {errors.genre && (
                        <p className="mt-1 text-xs text-rose-400">{errors.genre}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Plataforma <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        list="tgc-platform-options"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        placeholder="Ex: PC, PlayStation 5, Switch..."
                        className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
                      />
                      <datalist id="tgc-platform-options">
                        {(availablePlatforms.length > 0
                          ? availablePlatforms
                          : COMMON_PLATFORMS
                        ).map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                      {errors.platform && (
                        <p className="mt-1 text-xs text-rose-400">{errors.platform}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory Status Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Status na Biblioteca <span className="text-cyan-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {GAME_STATUSES.map((st) => {
                    const selected = status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusSelect(st)}
                        className={`flex items-center justify-center rounded-xl border px-3 py-2.5 transition ${
                          selected
                            ? 'border-cyan-400/70 bg-cyan-500/15 ring-1 ring-cyan-400/40'
                            : 'border-white/10 bg-slate-950/60 opacity-75 hover:border-white/25 hover:opacity-100'
                        }`}
                      >
                        <StatusBadge status={st} size="sm" />
                      </button>
                    );
                  })}
                </div>
                {errors.status && (
                  <p className="mt-1 text-xs text-rose-400">{errors.status}</p>
                )}
              </div>

              {/* Telemetry: Nota, Horas Jogadas, Data em que Zerou */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-slate-950/55 p-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <span>Nota (0 a 10)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={ratingInput}
                    onChange={(e) => setRatingInput(e.target.value)}
                    placeholder="Ex: 9.5"
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 text-sm font-mono text-white outline-none transition focus:border-cyan-400/60"
                  />
                  {errors.rating && (
                    <p className="mt-1 text-xs text-rose-400">{errors.rating}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Horas Jogadas</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99999"
                    step="0.5"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 text-sm font-mono text-white outline-none transition focus:border-cyan-400/60"
                  />
                  {errors.hours_played && (
                    <p className="mt-1 text-xs text-rose-400">{errors.hours_played}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Data em que Zerou
                  </label>
                  <input
                    type="date"
                    value={completedAt}
                    onChange={(e) => setCompletedAt(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60"
                  />
                  {errors.completed_at && (
                    <p className="mt-1 text-xs text-rose-400">{errors.completed_at}</p>
                  )}
                </div>
              </div>

              {/* Extended Game Metadata & Personal Notes */}
              <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Ficha Técnica &amp; Anotações Pessoais
                </p>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">
                      Desenvolvedora
                    </label>
                    <input
                      type="text"
                      value={developer}
                      onChange={(e) => setDeveloper(e.target.value)}
                      placeholder="Ex: FromSoftware"
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">
                      Publicadora
                    </label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Ex: Bandai Namco"
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">
                      Data de Lançamento
                    </label>
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                    />
                    {errors.release_date && (
                      <p className="mt-1 text-xs text-rose-400">{errors.release_date}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Formato / Mídia na Biblioteca
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Digital', 'Física', 'Assinatura'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setMediaFormat(fmt)}
                        className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                          mediaFormat === fmt
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                            : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Descrição / Sinopse do Jogo
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Sinopse ou descrição sobre o universo e proposta do jogo..."
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white outline-none focus:border-cyan-400/50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Suas Anotações / Review Pessoal
                  </label>
                  <textarea
                    rows={2}
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="Registre impressões, builds, conquistas ou lembretes pessoais..."
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/85 px-5 py-3.5 sm:px-6">
          {!isEditing && step === 'form' ? (
            <button
              type="button"
              onClick={() => setStep('search')}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              &larr; Voltar à Pesquisa
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Cancelar
            </button>
            {(step === 'form' || isEditing) && (
              <button
                type="submit"
                form="tgc-game-form"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
              >
                {submitting
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : 'Adicionar à Biblioteca'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
