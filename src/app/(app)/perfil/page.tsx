'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AtSign,
  Check,
  CheckCircle2,
  Copy,
  Fingerprint,
  Gamepad2,
  Loader2,
  Save,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { validateUsernameFormat } from '@/lib/validation/gameValidation';
import { computeLibraryStats, listUserGames } from '@/services/libraryService';
import {
  checkUsernameAvailability,
  updateUserProfile,
} from '@/services/profileService';
import {
  COMMON_GENRES,
  COMMON_PLATFORMS,
  UserGame,
} from '@/types/database';

export default function ProfilePage() {
  const { user, profile, setProfileState } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoritePlatform, setFavoritePlatform] = useState('PC');
  const [favoriteGenre, setFavoriteGenre] = useState('RPG');

  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message?: string;
  }>({ checking: false, available: null });

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [games, setGames] = useState<UserGame[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setFavoritePlatform(profile.favorite_platform || 'PC');
      setFavoriteGenre(profile.favorite_genre || 'RPG');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    listUserGames(user.id)
      .then(setGames)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!profile || !user) return;
    const trimmed = username.trim();
    if (trimmed.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameCheck({ checking: false, available: true, message: 'Seu @username atual' });
      return;
    }

    const formatErr = validateUsernameFormat(trimmed);
    if (formatErr) {
      setUsernameCheck({ checking: false, available: false, message: formatErr });
      return;
    }

    let cancelled = false;
    setUsernameCheck({ checking: true, available: null });
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(trimmed, user.id);
        if (!cancelled) {
          setUsernameCheck({
            checking: false,
            available: res.available,
            message: res.available ? 'Disponível para uso!' : res.reason,
          });
        }
      } catch {
        if (!cancelled) {
          setUsernameCheck({ checking: false, available: null });
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, profile, user]);

  const stats = useMemo(() => computeLibraryStats(games), [games]);

  const handleCopyPlayerCode = async () => {
    if (!profile?.player_code) return;
    try {
      await navigator.clipboard.writeText(profile.player_code);
      setCopied(true);
      showToast(`Código ${profile.player_code} copiado!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(`Código: ${profile.player_code}`, 'info');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formatErr = validateUsernameFormat(username);
    if (formatErr) {
      showToast(formatErr, 'error');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserProfile(user.id, {
        username: username.trim(),
        display_name: displayName.trim() || username.trim(),
        bio,
        avatar_url: avatarUrl.trim() || null,
        favorite_platform: favoritePlatform,
        favorite_genre: favoriteGenre,
      });
      setProfileState(updated);
      showToast('Perfil gamer atualizado com sucesso!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao atualizar perfil.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || username || 'TG').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2.5">
          <UserCircle2 className="h-6 w-6 text-cyan-400" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
            Meu Perfil Gamer
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Gerencie seu nome de usuário, sua bio e visualize seu Código Único de Jogador.
        </p>
      </div>

      {/* Player Identity Showcase Banner */}
      <section className="tgc-glass-panel rounded-3xl border border-cyan-400/25 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            {avatarUrl.trim() ? (
              <img
                src={avatarUrl.trim()}
                alt={displayName}
                className="h-20 w-20 rounded-2xl border-2 border-cyan-400/50 object-cover shadow-neon-cyan"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-500/25 to-indigo-500/35 font-display text-2xl font-bold text-cyan-200 shadow-neon-cyan">
                {initials}
              </div>
            )}

            <div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {profile?.display_name || 'Jogador'}
              </h2>
              <p className="text-sm font-medium text-cyan-300">
                @{profile?.username || 'usuario'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {favoritePlatform} • Fã de {favoriteGenre}
              </p>
            </div>
          </div>

          {/* Official Unique Player Code Box */}
          <div className="rounded-2xl border border-cyan-400/35 bg-slate-950/90 p-4 sm:min-w-[270px]">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan-300">
              <Fingerprint className="h-4 w-4" />
              <span>ID / Código Único de Jogador</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-xl font-bold tracking-wider text-white">
                {profile?.player_code || 'Gerando...'}
              </span>
              <button
                type="button"
                onClick={handleCopyPlayerCode}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Código permanente e exclusivo vinculado à sua conta TGC.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-950/60 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Biblioteca
            </span>
            <p className="mt-0.5 font-display text-2xl font-bold text-white">
              {stats.totalGames} jogos
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Jogando
            </span>
            <p className="mt-0.5 font-display text-2xl font-bold text-cyan-300">
              {stats.playingCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Zerados
            </span>
            <p className="mt-0.5 font-display text-2xl font-bold text-emerald-300">
              {stats.completedCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/60 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">
              Tempo Total
            </span>
            <p className="mt-0.5 font-display text-2xl font-bold text-indigo-300">
              {stats.totalHours}h
            </p>
          </div>
        </div>
      </section>

      {/* Edit Profile Form */}
      <form
        onSubmit={handleSave}
        className="tgc-glass-panel space-y-5 rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Gamepad2 className="h-5 w-5 text-cyan-400" />
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white">
            Dados do Perfil
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Nome de Exibição
            </label>
            <input
              type="text"
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Nome de Usuário (@username)
            </label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                maxLength={30}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-cyan-400/60"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameCheck.checking && (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                )}
                {!usernameCheck.checking && usernameCheck.available === true && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
                {!usernameCheck.checking && usernameCheck.available === false && (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}
              </div>
            </div>
            {usernameCheck.message && (
              <p
                className={`mt-1 text-xs ${
                  usernameCheck.available ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {usernameCheck.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Plataforma Principal
            </label>
            <select
              value={favoritePlatform}
              onChange={(e) => setFavoritePlatform(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
            >
              {COMMON_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Gênero Favorito
            </label>
            <select
              value={favoriteGenre}
              onChange={(e) => setFavoriteGenre(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
            >
              {COMMON_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
            URL do Avatar (opcional)
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://exemplo.com/seu-avatar.png"
            className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Bio Gamer
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre seu estilo de jogo, franquias favoritas ou conquistas..."
            className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
          />
          <p className="mt-1 text-right text-[11px] text-slate-500">
            {bio.length}/500 caracteres
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || usernameCheck.available === false}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
