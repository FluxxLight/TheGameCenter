'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Clock,
  Copy,
  Eye,
  Fingerprint,
  Gamepad2,
  Inbox,
  MessageSquare,
  Search,
  Send,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/library/ConfirmDialog';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import { PlayerSummaryModal } from '@/components/social/PlayerSummaryModal';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { supabase } from '@/lib/supabase/client';
import {
  findPlayerByCode,
  getSocialOverview,
  openOrCreateDirectConversation,
  removeFriendship,
  respondFriendRequest,
  sendFriendRequest,
} from '@/services/socialService';
import {
  FriendEntry,
  PlayerLookupResult,
  PublicPlayerProfile,
  RelationshipStatus,
  SocialOverview,
} from '@/types/social';

type FriendsTab = 'friends' | 'incoming' | 'outgoing';

function formatShortDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function FriendsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { refreshSocialCounts } = useSocial();
  const { showToast } = useToast();

  const [overview, setOverview] = useState<SocialOverview>({
    friends: [],
    incoming_requests: [],
    outgoing_requests: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  const [friendFilter, setFriendFilter] = useState('');

  // Player code lookup state
  const [codeInput, setCodeInput] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);
  const [lookupResult, setLookupResult] = useState<PlayerLookupResult | null>(
    null
  );
  const [lookupNotFound, setLookupNotFound] = useState(false);

  // Modals & action states
  const [copiedOwnCode, setCopiedOwnCode] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removingFriend, setRemovingFriend] = useState<FriendEntry | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<{
    player: PublicPlayerProfile;
    status: RelationshipStatus;
    friendshipId: string | null;
  } | null>(null);

  const loadOverview = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSocialOverview();
      setOverview(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar rede de amigos.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Realtime subscription for incoming/accepted/removed friendships
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`tgc-friends-page-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          loadOverview();
          refreshSocialCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadOverview, refreshSocialCounts]);

  const handleCopyMyCode = async () => {
    if (!profile?.player_code) return;
    try {
      await navigator.clipboard.writeText(profile.player_code);
      setCopiedOwnCode(true);
      showToast(`Seu código ${profile.player_code} foi copiado!`, 'success');
      setTimeout(() => setCopiedOwnCode(false), 2000);
    } catch {
      showToast(`Código: ${profile.player_code}`, 'info');
    }
  };

  const handleSearchByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = codeInput.trim();
    if (!cleaned) {
      showToast('Digite o código/ID único do jogador (ex: TGC-XXXX-XXXX).', 'info');
      return;
    }

    setSearchingCode(true);
    setLookupNotFound(false);
    try {
      const found = await findPlayerByCode(cleaned);
      if (!found) {
        setLookupResult(null);
        setLookupNotFound(true);
      } else {
        setLookupResult(found);
        setLookupNotFound(false);
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro na busca por código.',
        'error'
      );
    } finally {
      setSearchingCode(false);
    }
  };

  const refreshLookupIfOpen = async () => {
    if (lookupResult?.player_code) {
      try {
        const refreshed = await findPlayerByCode(lookupResult.player_code);
        setLookupResult(refreshed);
      } catch {
        // ignore
      }
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    setBusyId(targetUserId);
    try {
      await sendFriendRequest(targetUserId);
      showToast('Solicitação de amizade enviada!', 'success');
      await Promise.all([loadOverview(), refreshSocialCounts(), refreshLookupIfOpen()]);
      setInspectedPlayer(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Falha ao enviar solicitação.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRespondRequest = async (
    friendshipId: string,
    decision: 'accepted' | 'declined'
  ) => {
    setBusyId(friendshipId);
    try {
      await respondFriendRequest(friendshipId, decision);
      showToast(
        decision === 'accepted'
          ? 'Solicitação aceita! Agora vocês são amigos.'
          : 'Solicitação recusada.',
        decision === 'accepted' ? 'success' : 'info'
      );
      await Promise.all([loadOverview(), refreshSocialCounts(), refreshLookupIfOpen()]);
      setInspectedPlayer(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao processar solicitação.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelOutgoing = async (friendshipId: string) => {
    setBusyId(friendshipId);
    try {
      await removeFriendship(friendshipId);
      showToast('Solicitação pendente cancelada.', 'info');
      await Promise.all([loadOverview(), refreshSocialCounts(), refreshLookupIfOpen()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao cancelar solicitação.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmRemoveFriend = async () => {
    if (!removingFriend) return;
    setRemovingBusy(true);
    try {
      await removeFriendship(removingFriend.friendship_id);
      showToast(
        `${removingFriend.user.display_name || removingFriend.user.username} foi removido da sua lista de amigos.`,
        'info'
      );
      setRemovingFriend(null);
      setInspectedPlayer(null);
      await Promise.all([loadOverview(), refreshSocialCounts(), refreshLookupIfOpen()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao remover amigo.',
        'error'
      );
    } finally {
      setRemovingBusy(false);
    }
  };

  const handleStartDirectChat = async (friendUserId: string) => {
    setBusyId(friendUserId);
    try {
      const convId = await openOrCreateDirectConversation(friendUserId);
      router.push(`/mensagens?c=${encodeURIComponent(convId)}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao abrir conversa privada.',
        'error'
      );
      setBusyId(null);
    }
  };

  const filteredFriends = useMemo(() => {
    const q = friendFilter.trim().toLowerCase();
    if (!q) return overview.friends;
    return overview.friends.filter((item) => {
      const hay =
        `${item.user.display_name} ${item.user.username} ${item.user.player_code} ${item.user.favorite_platform}`.toLowerCase();
      return hay.includes(q);
    });
  }, [overview.friends, friendFilter]);

  return (
    <div className="space-y-8">
      {/* Header + Own Player Code Card */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="h-6 w-6 text-cyan-400" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Amigos &amp; Rede Gamer
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Adicione jogadores pelo código único, gerencie solicitações e inicie
            conversas privadas.
          </p>
        </div>

        {profile?.player_code && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-400/35 bg-slate-950/90 px-4 py-3 shadow-neon-cyan">
            <div>
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                <Fingerprint className="h-3.5 w-3.5" />
                Seu Código Único para Compartilhar
              </span>
              <p className="font-mono text-base font-bold tracking-wider text-white sm:text-lg">
                {profile.player_code}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyMyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
            >
              {copiedOwnCode ? (
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
        )}
      </div>

      {/* Search Player by Unique Code Section */}
      <section className="tgc-glass-panel rounded-3xl border border-cyan-500/25 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <form onSubmit={handleSearchByCode} className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label
                htmlFor="player-code-search"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Buscar Jogador pelo Código / ID Único
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                <input
                  id="player-code-search"
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Ex: TGC-8K4M-92QX"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-3 pl-10 pr-4 font-mono text-sm uppercase text-white placeholder:font-sans placeholder:normal-case placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={searchingCode}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                <Search className="h-4 w-4" />
                <span>{searchingCode ? 'Buscando...' : 'Buscar Jogador'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search Result Display */}
        {lookupNotFound && (
          <div className="mt-4 rounded-2xl border border-dashed border-rose-500/35 bg-rose-950/15 p-4 text-center text-xs text-rose-200">
            Nenhum jogador encontrado com o código{' '}
            <strong className="font-mono">{codeInput.trim().toUpperCase()}</strong>.
            Verifique os caracteres e tente novamente.
          </div>
        )}

        {lookupResult && (
          <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/35 bg-slate-950/85 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-center gap-4 min-w-0">
              <PlayerAvatar
                name={lookupResult.display_name || lookupResult.username}
                avatarUrl={lookupResult.avatar_url}
                size="lg"
                highlight
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-display text-xl font-bold text-white">
                    {lookupResult.display_name || lookupResult.username}
                  </h3>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-200">
                    {lookupResult.player_code}
                  </span>
                </div>
                <p className="text-xs font-medium text-cyan-300">
                  @{lookupResult.username}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Gamepad2 className="h-3.5 w-3.5 text-cyan-400" />
                    {lookupResult.favorite_platform || 'PC'}
                  </span>
                  <span>•</span>
                  <span>Fã de {lookupResult.favorite_genre || 'RPG'}</span>
                </p>
                {lookupResult.bio && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-300">
                    {lookupResult.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() =>
                  setInspectedPlayer({
                    player: lookupResult,
                    status: lookupResult.relationship_status,
                    friendshipId: lookupResult.friendship_id,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Ver Perfil</span>
              </button>

              {lookupResult.relationship_status === 'self' && (
                <span className="rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-xs text-slate-400">
                  Este é o seu perfil
                </span>
              )}

              {lookupResult.relationship_status === 'none' && (
                <button
                  type="button"
                  disabled={busyId === lookupResult.id}
                  onClick={() => handleSendFriendRequest(lookupResult.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Adicionar Amigo</span>
                </button>
              )}

              {lookupResult.relationship_status === 'outgoing_pending' &&
                lookupResult.friendship_id && (
                  <button
                    type="button"
                    disabled={busyId === lookupResult.friendship_id}
                    onClick={() =>
                      handleCancelOutgoing(lookupResult.friendship_id as string)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Pendente (Cancelar)</span>
                  </button>
                )}

              {lookupResult.relationship_status === 'incoming_pending' &&
                lookupResult.friendship_id && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === lookupResult.friendship_id}
                      onClick={() =>
                        handleRespondRequest(
                          lookupResult.friendship_id as string,
                          'accepted'
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Aceitar</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === lookupResult.friendship_id}
                      onClick={() =>
                        handleRespondRequest(
                          lookupResult.friendship_id as string,
                          'declined'
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-500/35 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Recusar</span>
                    </button>
                  </>
                )}

              {lookupResult.relationship_status === 'friends' && (
                <button
                  type="button"
                  disabled={busyId === lookupResult.id}
                  onClick={() => handleStartDirectChat(lookupResult.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Conversar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'friends'
              ? 'border-cyan-400/50 bg-cyan-500/20 text-white shadow-neon-cyan'
              : 'border-white/10 bg-slate-900/70 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="h-4 w-4 text-cyan-300" />
          <span>Meus Amigos</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white">
            {overview.friends.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'incoming'
              ? 'border-cyan-400/50 bg-cyan-500/20 text-white shadow-neon-cyan'
              : 'border-white/10 bg-slate-900/70 text-slate-400 hover:text-white'
          }`}
        >
          <Inbox className="h-4 w-4 text-emerald-400" />
          <span>Solicitações Recebidas</span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
              overview.incoming_requests.length > 0
                ? 'bg-cyan-400 text-slate-950'
                : 'bg-white/10 text-slate-300'
            }`}
          >
            {overview.incoming_requests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === 'outgoing'
              ? 'border-cyan-400/50 bg-cyan-500/20 text-white shadow-neon-cyan'
              : 'border-white/10 bg-slate-900/70 text-slate-400 hover:text-white'
          }`}
        >
          <Send className="h-4 w-4 text-indigo-400" />
          <span>Solicitações Enviadas</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {overview.outgoing_requests.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-36 animate-pulse rounded-2xl border border-white/10 bg-slate-900/60"
            />
          ))}
        </div>
      ) : activeTab === 'friends' ? (
        <div className="space-y-4">
          {overview.friends.length > 0 && (
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={friendFilter}
                onChange={(e) => setFriendFilter(e.target.value)}
                placeholder="Filtrar amigos por nome, @username ou código..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
              />
            </div>
          )}

          {filteredFriends.length === 0 ? (
            <div className="tgc-glass-panel rounded-3xl border border-dashed border-white/15 p-10 text-center">
              <Users className="mx-auto h-9 w-9 text-cyan-400" />
              <h2 className="mt-3 font-display text-2xl font-bold uppercase text-white">
                {overview.friends.length === 0
                  ? 'Sua lista de amigos está pronta para crescer'
                  : 'Nenhum amigo encontrado para este filtro'}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                Use a barra de busca acima para procurar jogadores pelo código único
                (ex: <span className="font-mono text-cyan-300">TGC-XXXX-XXXX</span>) e
                enviar uma solicitação de amizade.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((entry) => (
                <div
                  key={entry.friendship_id}
                  className="tgc-glass-panel tgc-card-hover flex flex-col justify-between gap-4 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3.5">
                    <PlayerAvatar
                      name={entry.user.display_name || entry.user.username}
                      avatarUrl={entry.user.avatar_url}
                      size="lg"
                      highlight
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-xl font-bold text-white">
                        {entry.user.display_name || entry.user.username}
                      </h3>
                      <p className="truncate text-xs font-medium text-cyan-300">
                        @{entry.user.username}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {entry.user.player_code}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {entry.user.favorite_platform} • {entry.user.favorite_genre}
                      </p>
                    </div>
                  </div>

                  {entry.user.bio && (
                    <p className="line-clamp-2 rounded-xl border border-white/5 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                      {entry.user.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      disabled={busyId === entry.user.id}
                      onClick={() => handleStartDirectChat(entry.user.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Mensagem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInspectedPlayer({
                          player: entry.user,
                          status: 'friends',
                          friendshipId: entry.friendship_id,
                        })
                      }
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                      title="Ver perfil resumido"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemovingFriend(entry)}
                      className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                      title="Remover amigo"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'incoming' ? (
        /* Incoming Pending Friend Requests */
        overview.incoming_requests.length === 0 ? (
          <div className="tgc-glass-panel rounded-3xl p-10 text-center">
            <Inbox className="mx-auto h-9 w-9 text-slate-500" />
            <p className="mt-3 font-display text-xl font-bold text-white">
              Nenhuma solicitação recebida pendente
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Compartilhe seu código <strong className="text-cyan-300">{profile?.player_code}</strong>{' '}
              com seus amigos!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {overview.incoming_requests.map((req) => (
              <div
                key={req.friendship_id}
                className="tgc-glass-panel flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/25 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <PlayerAvatar
                    name={req.user.display_name || req.user.username}
                    avatarUrl={req.user.avatar_url}
                    size="md"
                    highlight
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-white">
                      {req.user.display_name || req.user.username}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      @{req.user.username} •{' '}
                      <span className="font-mono text-cyan-300">
                        {req.user.player_code}
                      </span>{' '}
                      • Recebida em {formatShortDateTime(req.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setInspectedPlayer({
                        player: req.user,
                        status: 'incoming_pending',
                        friendshipId: req.friendship_id,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Ver Perfil
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.friendship_id}
                    onClick={() =>
                      handleRespondRequest(req.friendship_id, 'accepted')
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Aceitar</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.friendship_id}
                    onClick={() =>
                      handleRespondRequest(req.friendship_id, 'declined')
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Recusar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Outgoing Pending Friend Requests */
        overview.outgoing_requests.length === 0 ? (
          <div className="tgc-glass-panel rounded-3xl p-10 text-center">
            <Send className="mx-auto h-9 w-9 text-slate-500" />
            <p className="mt-3 font-display text-xl font-bold text-white">
              Nenhuma solicitação enviada aguardando resposta
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {overview.outgoing_requests.map((req) => (
              <div
                key={req.friendship_id}
                className="tgc-glass-panel flex flex-col justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <PlayerAvatar
                    name={req.user.display_name || req.user.username}
                    avatarUrl={req.user.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-lg font-bold text-white">
                        {req.user.display_name || req.user.username}
                      </p>
                      <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        Pendente
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      @{req.user.username} •{' '}
                      <span className="font-mono text-cyan-300">
                        {req.user.player_code}
                      </span>{' '}
                      • Enviada em {formatShortDateTime(req.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setInspectedPlayer({
                        player: req.user,
                        status: 'outgoing_pending',
                        friendshipId: req.friendship_id,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Ver Perfil
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.friendship_id}
                    onClick={() => handleCancelOutgoing(req.friendship_id)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    Cancelar Envio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Player Summary Modal */}
      <PlayerSummaryModal
        open={Boolean(inspectedPlayer)}
        player={inspectedPlayer?.player ?? null}
        relationshipStatus={inspectedPlayer?.status}
        onClose={() => setInspectedPlayer(null)}
        onSendRequest={
          inspectedPlayer?.status === 'none'
            ? () => handleSendFriendRequest(inspectedPlayer.player.id)
            : undefined
        }
        onAcceptRequest={
          inspectedPlayer?.status === 'incoming_pending' &&
          inspectedPlayer.friendshipId
            ? () =>
                handleRespondRequest(
                  inspectedPlayer.friendshipId as string,
                  'accepted'
                )
            : undefined
        }
        onDeclineRequest={
          inspectedPlayer?.status === 'incoming_pending' &&
          inspectedPlayer.friendshipId
            ? () =>
                handleRespondRequest(
                  inspectedPlayer.friendshipId as string,
                  'declined'
                )
            : undefined
        }
        onOpenChat={
          inspectedPlayer?.status === 'friends'
            ? () => handleStartDirectChat(inspectedPlayer.player.id)
            : undefined
        }
        onRemoveFriend={
          inspectedPlayer?.status === 'friends' && inspectedPlayer.friendshipId
            ? () => {
                const entry = overview.friends.find(
                  (f) => f.friendship_id === inspectedPlayer.friendshipId
                );
                if (entry) {
                  setInspectedPlayer(null);
                  setRemovingFriend(entry);
                }
              }
            : undefined
        }
      />

      {/* Confirm Remove Friend Dialog */}
      <ConfirmDialog
        open={Boolean(removingFriend)}
        title="Remover Amigo"
        description={
          removingFriend
            ? `Deseja remover "${removingFriend.user.display_name || removingFriend.user.username}" da sua lista de amigos?`
            : ''
        }
        confirmLabel="Remover Amigo"
        loading={removingBusy}
        onCancel={() => setRemovingFriend(null)}
        onConfirm={handleConfirmRemoveFriend}
      />
    </div>
  );
}
