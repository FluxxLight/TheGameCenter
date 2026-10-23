'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Award,
  Camera,
  Check,
  Clock,
  Copy,
  Edit3,
  Fingerprint,
  Gamepad2,
  Library,
  MessageSquareQuote,
  Palette,
  Save,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import { GameCover } from '@/components/ui/GameCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  computeLibraryStats,
  listRecentUserActivity,
  listUserGames,
} from '@/services/libraryService';
import { validateUsernameFormat } from '@/lib/validation/gameValidation';
import { updateUserProfile } from '@/services/profileService';
import {
  COMMON_GENRES,
  COMMON_PLATFORMS,
  GameStatus,
  UserActivityEvent,
  UserGame,
} from '@/types/database';

async function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler imagem de perfil.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido.'));
      img.onload = () => {
        const size = 180;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const PRESET_GAMER_AVATARS = [
  {
    label: 'Cyber Visor',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=NexusPrime&backgroundColor=06b6d4',
  },
  {
    label: 'Phantom Vanguard',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=VanguardX&backgroundColor=8b5cf6',
  },
  {
    label: 'Crimson Mecha',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=CrimsonCore&backgroundColor=ef4444',
  },
  {
    label: 'Venom Synth',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=VenomPulse&backgroundColor=10b981',
  },
];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { friendsCount } = useSocial();
  const { activeTheme, themes } = useTheme();
  const { showToast } = useToast();

  const [games, setGames] = useState<UserGame[]>([]);
  const [activity, setActivity] = useState<UserActivityEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit profile mode
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [favoritePlatform, setFavoritePlatform] = useState('PC');
  const [favoriteGenre, setFavoriteGenre] = useState('RPG');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const syncFormWithProfile = useCallback(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setDisplayName(profile.display_name || '');
    setAvatarUrl(profile.avatar_url || '');
    setBio(profile.bio || '');
    setFavoritePlatform(profile.favorite_platform || 'PC');
    setFavoriteGenre(profile.favorite_genre || 'RPG');
  }, [profile]);

  useEffect(() => {
    syncFormWithProfile();
  }, [syncFormWithProfile]);

  const loadProfileData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [userGames, recentEvents] = await Promise.all([
        listUserGames(user.id),
        listRecentUserActivity(user.id, 12),
      ]);
      setGames(userGames);
      setActivity(recentEvents);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar dados do seu perfil.',
        'error'
      );
    } finally {
      setLoadingData(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const stats = useMemo(() => computeLibraryStats(games), [games]);

  const completedGames = useMemo(
    () =>
      [...games]
        .filter((g) => g.status === 'Zerei')
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [games]
  );

  const ratedOrNotedGames = useMemo(
    () =>
      [...games]
        .filter(
          (g) => g.rating !== null || (g.personal_notes || '').trim().length > 0
        )
        .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1)),
    [games]
  );

  const activeThemeMeta = useMemo(
    () => themes.find((t) => t.id === activeTheme) ?? themes[0],
    [themes, activeTheme]
  );

  const handleCopyPlayerCode = async () => {
    if (!profile?.player_code) return;
    try {
      await navigator.clipboard.writeText(profile.player_code);
      setCopiedId(true);
      showToast(`Player ID ${profile.player_code} copiado!`, 'success');
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      showToast(`Player ID: ${profile.player_code}`, 'info');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Escolha uma imagem de até 8 MB.', 'error');
      return;
    }
    try {
      const dataUrl = await compressAvatarFile(file);
      setAvatarUrl(dataUrl);
      showToast('Foto carregada! Clique em "Salvar Alterações" para confirmar.', 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao processar foto.',
        'error'
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const userErr = validateUsernameFormat(username);
    if (userErr) {
      showToast(userErr, 'error');
      return;
    }
    if (!displayName.trim() || displayName.trim().length < 2) {
      showToast('Informe um nome de exibição com pelo menos 2 caracteres.', 'error');
      return;
    }
    if (displayName.trim().length > 60) {
      showToast('O nome de exibição deve ter no máximo 60 caracteres.', 'error');
      return;
    }
    if (bio.length > 300) {
      showToast('A bio deve ter no máximo 300 caracteres.', 'error');
      return;
    }
    if (avatarUrl.trim().length > 200000) {
      showToast('A imagem de perfil excede o limite permitido.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
        bio,
        favorite_platform: favoritePlatform,
        favorite_genre: favoriteGenre,
      });
      await refreshProfile();
      setEditing(false);
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao atualizar perfil.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Profile Hero Card: Foto, Nome de Usuário, ID Único, Bio & Editar */}
      <section className="tgc-glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/12 blur-[90px]"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <PlayerAvatar
              name={
                (editing ? displayName : profile?.display_name) ||
                profile?.username ||
                'Gamer'
              }
              avatarUrl={editing ? avatarUrl : profile?.avatar_url}
              size="xl"
              highlight
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
                  {profile?.display_name || profile?.username || 'Jogador'}
                </h1>
                <span className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-3 py-0.5 text-xs font-semibold text-cyan-200">
                  @{profile?.username || 'gamer'}
                </span>
              </div>

              {/* Bio */}
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                {profile?.bio?.trim()
                  ? profile.bio
                  : 'Explorando mundos, registrando conquistas e organizando minha coleção no The Game Center.'}
              </p>

              {/* Unique Player ID + Favorite Badges + Theme Shortcut */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {profile?.player_code && (
                  <button
                    type="button"
                    onClick={handleCopyPlayerCode}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-slate-950/80 px-3 py-1.5 font-mono text-xs font-bold text-cyan-200 transition hover:border-cyan-400/70"
                    title="Copiar ID único do jogador"
                  >
                    <Fingerprint className="h-3.5 w-3.5 text-cyan-400" />
                    <span>ID: {profile.player_code}</span>
                    {copiedId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                )}

                <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                  <Gamepad2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{profile?.favorite_platform || 'PC'}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                  <Award className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{profile?.favorite_genre || 'RPG'}</span>
                </span>

                <Link
                  href="/configuracoes?tab=aparencia"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                >
                  <Palette className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Tema: {activeThemeMeta.name}</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  syncFormWithProfile();
                  setEditing(false);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-200 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="tgc-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider"
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar Perfil</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Profile Editor Form */}
        {editing && (
          <form
            onSubmit={handleSave}
            className="mt-7 space-y-5 border-t border-white/10 pt-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                Editar Identidade do Jogador
              </h2>
              <span className="text-xs text-slate-400">
                Alterações salvas diretamente no Supabase
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Username único (@) *
                </label>
                <input
                  id="profile-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-tgc-input px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/70"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-displayname"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Nome de Exibição *
                </label>
                <input
                  id="profile-displayname"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-tgc-input px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/70"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-avatar"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  <Camera className="h-3.5 w-3.5 text-cyan-400" />
                  Foto de Perfil (Envie arquivo, cole URL ou escolha avatar rápido)
                </label>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    id="profile-avatar"
                    type="text"
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder={
                      avatarUrl.startsWith('data:')
                        ? 'Foto carregada do seu dispositivo'
                        : 'https://exemplo.com/seu-avatar.png'
                    }
                    className="flex-1 rounded-xl border border-white/15 bg-tgc-input px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/70"
                  />
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25">
                    <Camera className="h-4 w-4" />
                    <span>Enviar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Avatares rápidos:
                  </span>
                  {PRESET_GAMER_AVATARS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-rose-300 hover:bg-rose-500/15"
                    >
                      Usar iniciais
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-platform"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Plataforma Favorita
                </label>
                <select
                  id="profile-platform"
                  value={favoritePlatform}
                  onChange={(e) => setFavoritePlatform(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-tgc-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400/70"
                >
                  {COMMON_PLATFORMS.map((p) => (
                    <option key={p} value={p} className="bg-slate-950">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="profile-genre"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Gênero Favorito
                </label>
                <select
                  id="profile-genre"
                  value={favoriteGenre}
                  onChange={(e) => setFavoriteGenre(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-tgc-input px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400/70"
                >
                  {COMMON_GENRES.map((g) => (
                    <option key={g} value={g} className="bg-slate-950">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-bio"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Bio Gamer ({bio.length}/300)
                </label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte sobre suas franquias favoritas, estilo de jogo ou conquistas marcantes..."
                  className="w-full rounded-xl border border-white/15 bg-tgc-input p-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/70"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="tgc-btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. Estatísticas do Jogador */}
      <section aria-label="Estatísticas do perfil">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="tgc-glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Biblioteca</span>
              <Library className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-white">
              {loadingData ? '...' : stats.totalGames}
            </p>
            <p className="text-[11px] text-slate-400">Jogos registrados</p>
          </div>

          <div className="tgc-glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Concluídos</span>
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-emerald-300">
              {loadingData ? '...' : stats.completedCount}
            </p>
            <p className="text-[11px] text-slate-400">
              {stats.completionRate}% da biblioteca
            </p>
          </div>

          <div className="tgc-glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Jogando</span>
              <Gamepad2 className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-cyan-300">
              {loadingData ? '...' : stats.playingCount}
            </p>
            <p className="text-[11px] text-slate-400">Em progresso</p>
          </div>

          <div className="tgc-glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Horas Jogadas</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-amber-300">
              {loadingData ? '...' : `${stats.totalHours.toFixed(1)}h`}
            </p>
            <p className="text-[11px] text-slate-400">Tempo acumulado</p>
          </div>

          <div className="tgc-glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Média Pessoal</span>
              <Star className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-white">
              {loadingData
                ? '...'
                : stats.averageRating !== null
                ? stats.averageRating.toFixed(1)
                : '—'}
            </p>
            <p className="text-[11px] text-slate-400">
              {ratedOrNotedGames.length} avaliação(ões)
            </p>
          </div>

          <Link
            href="/amigos"
            className="tgc-glass-panel tgc-card-hover rounded-2xl p-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Amigos</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-indigo-300">
              {friendsCount}
            </p>
            <p className="text-[11px] text-slate-400">Conexões ativas</p>
          </Link>
        </div>
      </section>

      {/* Main Content Grid: Completed Games, Personal Ratings/Notes & Recent Activity */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Left 7 Columns: Jogos Concluídos + Avaliações e Notas Pessoais */}
        <div className="space-y-7 lg:col-span-7">
          {/* 3. Jogos Concluídos */}
          <section className="tgc-glass-panel rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Jogos Concluídos ({completedGames.length})
                </h2>
              </div>
              <Link
                href="/biblioteca"
                className="text-xs font-semibold text-cyan-300 hover:underline"
              >
                Abrir Biblioteca
              </Link>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-36 animate-pulse rounded-2xl bg-slate-900/60"
                  />
                ))}
              </div>
            ) : completedGames.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                <p className="text-sm font-medium text-slate-200">
                  Nenhum jogo marcado como &quot;Zerei&quot; ainda.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Quando você finalizar uma campanha, marque como &quot;Zerei&quot; na sua
                  biblioteca para imortalizá-la aqui!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                {completedGames.slice(0, 6).map((game) => (
                  <Link
                    key={game.id}
                    href={`/biblioteca/${game.id}`}
                    className="tgc-card-hover group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <GameCover
                        title={game.title}
                        coverUrl={game.cover_url}
                        genre={game.genre}
                        platform={game.platform}
                        className="h-full w-full"
                      />
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                        <Trophy className="h-2.5 w-2.5" /> Zerei
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="truncate font-display text-base font-bold text-white group-hover:text-cyan-300">
                        {game.title}
                      </h3>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate">{game.platform}</span>
                        <span>{Number(game.hours_played || 0)}h</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 4. Avaliações & Notas Pessoais */}
          <section className="tgc-glass-panel rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-amber-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Avaliações &amp; Notas Pessoais
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {ratedOrNotedGames.length} registro(s)
              </span>
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-24 animate-pulse rounded-2xl bg-slate-900/60"
                  />
                ))}
              </div>
            ) : ratedOrNotedGames.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                <p className="text-sm font-medium text-slate-200">
                  Você ainda não registrou notas ou avaliações pessoais.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Abra qualquer jogo da sua biblioteca para atribuir uma nota de 0 a 10 e
                  escrever suas impressões!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ratedOrNotedGames.slice(0, 6).map((game) => (
                  <Link
                    key={`review-${game.id}`}
                    href={`/biblioteca/${game.id}`}
                    className="block rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-400/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <GameCover
                          title={game.title}
                          coverUrl={game.cover_url}
                          genre={game.genre}
                          platform={game.platform}
                          className="h-14 w-10 shrink-0 rounded-lg border border-white/15"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-bold text-white">
                            {game.title}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <StatusBadge status={game.status} size="sm" />
                            <span className="text-xs text-slate-400">
                              {game.platform}
                            </span>
                          </div>
                        </div>
                      </div>

                      {game.rating !== null && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-amber-400/35 bg-amber-500/15 px-3 py-1 font-mono text-sm font-bold text-amber-300">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(game.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {game.personal_notes?.trim() && (
                      <p className="mt-3 rounded-xl border border-white/5 bg-slate-900/75 p-3 text-xs italic leading-relaxed text-slate-300">
                        &ldquo;{game.personal_notes.trim()}&rdquo;
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 5 Columns: 5. Atividade Recente */}
        <div className="lg:col-span-5">
          <section className="tgc-glass-panel rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
                  Atividade Recente
                </h2>
              </div>
              <span className="text-xs text-slate-400">Linha do tempo</span>
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-16 animate-pulse rounded-2xl bg-slate-900/60"
                  />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                <p className="text-sm font-medium text-slate-200">
                  Nenhuma atividade registrada ainda.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Suas adições de jogos, evoluções de status e avaliações aparecerão
                  automaticamente aqui!
                </p>
              </div>
            ) : (
              <ol className="relative ml-2.5 space-y-4 border-l border-white/15 pl-5">
                {activity.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border border-cyan-300 bg-cyan-400 shadow-neon-cyan" />

                    <Link
                      href={`/biblioteca/${ev.user_game_id}`}
                      className="block rounded-2xl border border-white/10 bg-slate-950/65 p-3.5 transition hover:border-cyan-400/40"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="truncate font-semibold text-cyan-300">
                          {ev.game_title}
                        </span>
                        <time className="shrink-0 font-mono">
                          {new Date(ev.occurred_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-white">
                        {ev.title}
                      </p>

                      {ev.description && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {ev.description}
                        </p>
                      )}

                      {ev.to_status && (
                        <div className="mt-2">
                          <StatusBadge
                            status={ev.to_status as GameStatus}
                            size="sm"
                          />
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
