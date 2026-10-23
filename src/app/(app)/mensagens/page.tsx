'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { CreateGroupModal } from '@/components/social/CreateGroupModal';
import { GroupManageModal } from '@/components/social/GroupManageModal';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import { PlayerSummaryModal } from '@/components/social/PlayerSummaryModal';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useSocial } from '@/contexts/SocialContext';
import { supabase } from '@/lib/supabase/client';
import {
  addGroupMembers,
  createGroupConversation,
  getConversationThread,
  getSocialOverview,
  leaveGroupConversation,
  listMyConversations,
  markConversationRead,
  openOrCreateDirectConversation,
  removeGroupMember,
  sendConversationMessage,
  updateGroupInfo,
} from '@/services/socialService';
import {
  ConversationParticipant,
  ConversationSummary,
  ConversationThread,
  FriendEntry,
  PublicPlayerProfile,
} from '@/types/social';

type ListFilter = 'all' | 'direct' | 'group';

function formatMessageTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatConversationListTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const dt = new Date(iso);
    const now = new Date();
    const sameDay =
      dt.getDate() === now.getDate() &&
      dt.getMonth() === now.getMonth() &&
      dt.getFullYear() === now.getFullYear();

    if (sameDay) {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(dt);
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(dt);
  } catch {
    return '';
  }
}

function getDirectPeer(
  participants: ConversationParticipant[],
  currentUserId: string
): ConversationParticipant | null {
  return participants.find((p) => p.id !== currentUserId) ?? participants[0] ?? null;
}

function MessagesHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { refreshSocialCounts } = useSocial();
  const { showToast } = useToast();

  const selectedIdFromUrl = searchParams?.get('c') || null;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeConvId, setActiveConvId] = useState<string | null>(
    selectedIdFromUrl
  );
  const [activeThread, setActiveThread] = useState<ConversationThread | null>(
    null
  );
  const [loadingThread, setLoadingThread] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  // Composer
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // Modals
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newDmModalOpen, setNewDmModalOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [inspectedPlayer, setInspectedPlayer] =
    useState<PublicPlayerProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveConvId(selectedIdFromUrl);
  }, [selectedIdFromUrl]);

  const selectConversation = useCallback(
    (convId: string | null) => {
      setActiveConvId(convId);
      setAccessDeniedMsg(null);
      if (convId) {
        router.replace(`/mensagens?c=${encodeURIComponent(convId)}`, {
          scroll: false,
        });
      } else {
        router.replace('/mensagens', { scroll: false });
      }
    },
    [router]
  );

  const loadSidebarData = useCallback(async () => {
    if (!user) return;
    try {
      const [convList, social] = await Promise.all([
        listMyConversations(),
        getSocialOverview(),
      ]);
      setConversations(convList);
      setFriends(social.friends);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar conversas.',
        'error'
      );
    } finally {
      setLoadingList(false);
    }
  }, [user, showToast]);

  const loadActiveThread = useCallback(
    async (convId: string, silent = false) => {
      if (!user) return;
      if (!silent) setLoadingThread(true);
      try {
        const thread = await getConversationThread(convId, 250);
        setActiveThread(thread);
        setAccessDeniedMsg(null);
        await markConversationRead(convId);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
        );
        refreshSocialCounts();
      } catch (err) {
        setActiveThread(null);
        const msg =
          err instanceof Error
            ? err.message
            : 'Você não tem permissão para acessar esta conversa.';
        setAccessDeniedMsg(msg);
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [user, refreshSocialCounts]
  );

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  useEffect(() => {
    if (activeConvId) {
      loadActiveThread(activeConvId);
    } else {
      setActiveThread(null);
    }
  }, [activeConvId, loadActiveThread]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  // Realtime updates for messages, group changes & new conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`tgc-messages-hub-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_messages' },
        (payload) => {
          const insertedConvId = String(
            (payload.new as { conversation_id?: string })?.conversation_id || ''
          );
          loadSidebarData();
          if (activeConvId && insertedConvId === activeConvId) {
            loadActiveThread(activeConvId, true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        () => {
          loadSidebarData();
          if (activeConvId) {
            loadActiveThread(activeConvId, true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => {
          loadSidebarData();
          if (activeConvId) {
            loadActiveThread(activeConvId, true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConvId, loadSidebarData, loadActiveThread]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (listFilter !== 'all' && conv.kind !== listFilter) return false;
      if (!q) return true;
      const peer =
        conv.kind === 'direct' && user
          ? getDirectPeer(conv.participants, user.id)
          : null;
      const title =
        conv.kind === 'group'
          ? conv.name || 'Grupo'
          : `${peer?.display_name || ''} ${peer?.username || ''}`;
      return (
        title.toLowerCase().includes(q) ||
        conv.last_message_preview.toLowerCase().includes(q)
      );
    });
  }, [conversations, listFilter, searchQuery, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !draft.trim() || sending) return;

    const text = draft.trim();
    setSending(true);
    try {
      const sentMsg = await sendConversationMessage(activeConvId, text);
      setDraft('');
      setActiveThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.some((m) => m.id === sentMsg.id)
                ? prev.messages
                : [...prev.messages, sentMsg],
            }
          : prev
      );
      loadSidebarData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao enviar mensagem.',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async (params: {
    name: string;
    description: string;
    memberIds: string[];
  }) => {
    const newConvId = await createGroupConversation(params);
    showToast(`Grupo "${params.name}" criado com sucesso!`, 'success');
    await loadSidebarData();
    selectConversation(newConvId);
  };

  const handleStartDmWithFriend = async (friendId: string) => {
    try {
      const convId = await openOrCreateDirectConversation(friendId);
      setNewDmModalOpen(false);
      await loadSidebarData();
      selectConversation(convId);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao abrir conversa.',
        'error'
      );
    }
  };

  const handleAddGroupMembers = async (friendIds: string[]) => {
    if (!activeConvId) return;
    try {
      const count = await addGroupMembers(activeConvId, friendIds);
      showToast(
        `${count} ${count === 1 ? 'amigo adicionado' : 'amigos adicionados'} ao grupo!`,
        'success'
      );
      await Promise.all([
        loadSidebarData(),
        loadActiveThread(activeConvId, true),
      ]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao adicionar participantes.',
        'error'
      );
    }
  };

  const handleRemoveGroupMember = async (targetUserId: string) => {
    if (!activeConvId) return;
    try {
      await removeGroupMember(activeConvId, targetUserId);
      showToast('Participante removido do grupo.', 'info');
      await Promise.all([
        loadSidebarData(),
        loadActiveThread(activeConvId, true),
      ]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao remover participante.',
        'error'
      );
    }
  };

  const handleRenameGroup = async (name: string, description: string) => {
    if (!activeConvId) return;
    try {
      await updateGroupInfo({
        conversationId: activeConvId,
        name,
        description,
      });
      showToast('Dados do grupo atualizados!', 'success');
      await Promise.all([
        loadSidebarData(),
        loadActiveThread(activeConvId, true),
      ]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao editar grupo.',
        'error'
      );
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeConvId) return;
    try {
      await leaveGroupConversation(activeConvId);
      setGroupManageOpen(false);
      showToast('Você saiu do grupo.', 'info');
      selectConversation(null);
      await Promise.all([loadSidebarData(), refreshSocialCounts()]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao sair do grupo.',
        'error'
      );
    }
  };

  const activeConv = activeThread?.conversation ?? null;
  const activePeer =
    activeConv?.kind === 'direct' && user
      ? getDirectPeer(activeConv.participants, user.id)
      : null;

  const friendIdSet = useMemo(
    () => new Set(friends.map((f) => f.user.id)),
    [friends]
  );

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-cyan-400" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Mensagens &amp; Grupos
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">
            Conversas privadas entre amigos e grupos táticos protegidos por RLS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setNewDmModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>Nova Conversa</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateGroupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Grupo</span>
          </button>
        </div>
      </div>

      {/* Security Alert Banner when trying to access an unauthorized conversation via URL */}
      {accessDeniedMsg && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/45 bg-rose-950/35 px-4 py-3 text-xs text-rose-200">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{accessDeniedMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => selectConversation(null)}
            className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/20"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Split-Pane Messenger Container */}
      <div className="tgc-glass-panel grid h-[calc(100vh-14.5rem)] min-h-[520px] grid-cols-1 overflow-hidden rounded-3xl border border-white/10 lg:grid-cols-12">
        {/* LEFT PANE: Conversations & Groups List */}
        <div
          className={`flex flex-col border-r border-white/10 bg-slate-950/65 lg:col-span-4 ${
            activeConvId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Filter Tabs & Search */}
          <div className="space-y-3 border-b border-white/10 p-3.5">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-900/90 p-1">
              {(
                [
                  { id: 'all', label: 'Todas' },
                  { id: 'direct', label: 'Diretas' },
                  { id: 'group', label: 'Grupos' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setListFilter(tab.id)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    listFilter === tab.id
                      ? 'bg-cyan-500/20 text-cyan-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversa ou grupo..."
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto p-2.5">
            {loadingList ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className="h-16 animate-pulse rounded-2xl bg-slate-900/70"
                  />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-8 w-8 text-slate-500" />
                <p className="mt-3 font-display text-lg font-bold text-white">
                  Nenhuma conversa ainda
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Inicie um chat com um amigo ou crie um grupo privado!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredConversations.map((conv) => {
                  const selected = conv.id === activeConvId;
                  const isGroup = conv.kind === 'group';
                  const peer =
                    !isGroup && user
                      ? getDirectPeer(conv.participants, user.id)
                      : null;
                  const title = isGroup
                    ? conv.name || 'Grupo Privado'
                    : peer?.display_name || peer?.username || 'Amigo';

                  const hasUnread = conv.unread_count > 0;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => selectConversation(conv.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        selected
                          ? 'border-cyan-400/50 bg-cyan-500/15 shadow-neon-cyan'
                          : hasUnread
                            ? 'border-cyan-400/30 bg-slate-900/90 hover:bg-slate-900'
                            : 'border-transparent bg-slate-900/40 hover:border-white/10 hover:bg-slate-900/75'
                      }`}
                    >
                      {isGroup ? (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/35 bg-indigo-500/20 text-indigo-200">
                          <Users className="h-5 w-5" />
                        </div>
                      ) : (
                        <PlayerAvatar
                          name={title}
                          avatarUrl={peer?.avatar_url}
                          size="md"
                          highlight={hasUnread}
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`truncate font-display text-base ${
                              hasUnread
                                ? 'font-bold text-white'
                                : 'font-semibold text-slate-200'
                            }`}
                          >
                            {title}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-slate-400">
                            {formatConversationListTime(
                              conv.last_message_at || conv.created_at
                            )}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-xs ${
                              hasUnread
                                ? 'font-semibold text-cyan-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {conv.last_message_preview ||
                              (isGroup
                                ? `${conv.participants.length} participantes`
                                : 'Conversa iniciada — envie um oi!')}
                          </p>

                          {hasUnread && (
                            <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-cyan-400 px-1.5 font-mono text-[10px] font-bold text-slate-950 shadow-neon-cyan">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Chat Thread */}
        <div
          className={`flex flex-col bg-slate-950/35 lg:col-span-8 ${
            activeConvId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!activeConvId ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-neon-cyan">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white">
                Central de Comunicação Gamer
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-slate-400">
                Selecione uma conversa ao lado, abra um chat privado com um amigo ou
                crie um grupo para coordenar suas próximas partidas.
              </p>
            </div>
          ) : loadingThread ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="animate-pulse font-display text-lg uppercase tracking-wider text-cyan-300">
                Carregando histórico seguro...
              </p>
            </div>
          ) : !activeConv ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <ShieldAlert className="h-10 w-10 text-rose-400" />
              <p className="mt-3 font-display text-xl font-bold text-white">
                Conversa indisponível ou sem permissão
              </p>
              <button
                type="button"
                onClick={() => selectConversation(null)}
                className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Voltar às minhas conversas
              </button>
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-3.5 sm:px-6">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => selectConversation(null)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
                    aria-label="Voltar para lista de conversas"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  {activeConv.kind === 'group' ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/40 bg-indigo-500/20 text-indigo-200">
                      <Users className="h-5 w-5" />
                    </div>
                  ) : (
                    <PlayerAvatar
                      name={
                        activePeer?.display_name || activePeer?.username || 'Amigo'
                      }
                      avatarUrl={activePeer?.avatar_url}
                      size="md"
                      highlight
                    />
                  )}

                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-bold text-white sm:text-xl">
                      {activeConv.kind === 'group'
                        ? activeConv.name || 'Grupo Privado'
                        : activePeer?.display_name ||
                          activePeer?.username ||
                          'Conversa Direta'}
                    </h2>
                    <p className="truncate text-xs text-slate-400">
                      {activeConv.kind === 'group'
                        ? `${activeConv.participants.length} participantes • Grupo Privado`
                        : `@${activePeer?.username || 'jogador'} • ${activePeer?.player_code || ''}`}
                    </p>
                  </div>
                </div>

                {/* Header Right Action */}
                {activeConv.kind === 'group' ? (
                  <button
                    type="button"
                    onClick={() => setGroupManageOpen(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Participantes ({activeConv.participants.length})</span>
                  </button>
                ) : (
                  activePeer && (
                    <button
                      type="button"
                      onClick={() => setInspectedPlayer(activePeer)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ver Perfil</span>
                    </button>
                  )
                )}
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-6">
                {activeThread?.messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="font-display text-lg font-semibold text-slate-300">
                      Nenhuma mensagem enviada ainda
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Envie a primeira mensagem abaixo para iniciar o histórico.
                    </p>
                  </div>
                ) : (
                  activeThread?.messages.map((msg) => {
                    if (msg.message_type === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center py-1">
                          <span className="rounded-full border border-white/10 bg-slate-900/85 px-3.5 py-1 text-[11px] text-slate-400">
                            {msg.body} • {formatMessageTime(msg.created_at)}
                          </span>
                        </div>
                      );
                    }

                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isMine && (
                          <button
                            type="button"
                            onClick={() => {
                              const foundPart = activeConv.participants.find(
                                (p) => p.id === msg.sender_id
                              );
                              if (foundPart) setInspectedPlayer(foundPart);
                            }}
                            className="shrink-0"
                          >
                            <PlayerAvatar
                              name={
                                msg.sender.display_name || msg.sender.username
                              }
                              avatarUrl={msg.sender.avatar_url}
                              size="xs"
                            />
                          </button>
                        )}

                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                            isMine
                              ? 'rounded-br-sm bg-gradient-to-br from-cyan-500/25 to-indigo-500/30 border border-cyan-400/35 text-white'
                              : 'rounded-bl-sm border border-white/10 bg-slate-900/90 text-slate-100'
                          }`}
                        >
                          {!isMine && activeConv.kind === 'group' && (
                            <p className="mb-0.5 text-[11px] font-bold text-cyan-300">
                              {msg.sender.display_name || msg.sender.username}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {msg.body}
                          </p>
                          <p
                            className={`mt-1 text-right font-mono text-[10px] ${
                              isMine ? 'text-cyan-200/75' : 'text-slate-500'
                            }`}
                          >
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="border-t border-white/10 bg-slate-950/85 p-3.5 sm:px-5">
                {!activeConv.can_send ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>
                      Apenas amigos ativos podem trocar novas mensagens diretas.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
                    <textarea
                      rows={1}
                      maxLength={4000}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder={
                        activeConv.kind === 'group'
                          ? `Enviar mensagem em ${activeConv.name || 'grupo'}...`
                          : `Enviar mensagem para ${activePeer?.display_name || 'amigo'}...`
                      }
                      className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Enviar</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: Start New Direct Conversation with a Friend */}
      {newDmModalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="tgc-glass-panel w-full max-w-md rounded-3xl border border-cyan-400/30 p-6 shadow-panel-elevated">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                Iniciar Conversa Privada
              </h3>
              <button
                type="button"
                onClick={() => setNewDmModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-300">
                  Você ainda não possui amigos confirmados na lista.
                </p>
                <Link
                  href="/amigos"
                  onClick={() => setNewDmModalOpen(false)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30"
                >
                  <span>Buscar Amigos pelo Código Único</span>
                </Link>
              </div>
            ) : (
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {friends.map((f) => (
                  <button
                    key={f.user.id}
                    type="button"
                    onClick={() => handleStartDmWithFriend(f.user.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/75 p-3 text-left transition hover:border-cyan-400/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar
                        name={f.user.display_name || f.user.username}
                        avatarUrl={f.user.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold text-white">
                          {f.user.display_name || f.user.username}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          @{f.user.username} • {f.user.player_code}
                        </p>
                      </div>
                    </div>
                    <MessageSquare className="h-4 w-4 shrink-0 text-cyan-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Group */}
      <CreateGroupModal
        open={createGroupOpen}
        friends={friends}
        onClose={() => setCreateGroupOpen(false)}
        onCreate={handleCreateGroup}
      />

      {/* Modal: Group Participants & Management */}
      {user && (
        <GroupManageModal
          open={groupManageOpen}
          currentUserId={user.id}
          group={activeConv?.kind === 'group' ? activeConv : null}
          friends={friends}
          onClose={() => setGroupManageOpen(false)}
          onInspectPlayer={(p) => setInspectedPlayer(p)}
          onAddMembers={handleAddGroupMembers}
          onRemoveMember={handleRemoveGroupMember}
          onRenameGroup={handleRenameGroup}
          onLeaveGroup={handleLeaveGroup}
        />
      )}

      {/* Modal: Inspected Player Profile */}
      <PlayerSummaryModal
        open={Boolean(inspectedPlayer)}
        player={inspectedPlayer}
        relationshipStatus={
          inspectedPlayer
            ? inspectedPlayer.id === user?.id
              ? 'self'
              : friendIdSet.has(inspectedPlayer.id)
                ? 'friends'
                : 'none'
            : undefined
        }
        onClose={() => setInspectedPlayer(null)}
        onOpenChat={
          inspectedPlayer &&
          inspectedPlayer.id !== user?.id &&
          friendIdSet.has(inspectedPlayer.id)
            ? () => {
                const targetId = inspectedPlayer.id;
                setInspectedPlayer(null);
                setGroupManageOpen(false);
                handleStartDmWithFriend(targetId);
              }
            : undefined
        }
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[520px] animate-pulse rounded-3xl border border-white/10 bg-slate-900/50" />
      }
    >
      <MessagesHubContent />
    </Suspense>
  );
}
