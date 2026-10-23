'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Edit3,
  LogOut,
  Plus,
  Save,
  Shield,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import {
  ConversationParticipant,
  ConversationSummary,
  FriendEntry,
  PublicPlayerProfile,
} from '@/types/social';

interface GroupManageModalProps {
  open: boolean;
  currentUserId: string;
  group: Omit<ConversationSummary, 'unread_count'> | null;
  friends: FriendEntry[];
  onClose: () => void;
  onInspectPlayer: (player: PublicPlayerProfile) => void;
  onAddMembers: (friendIds: string[]) => Promise<void>;
  onRemoveMember: (targetUserId: string) => Promise<void>;
  onRenameGroup: (name: string, description: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
}

export function GroupManageModal({
  open,
  currentUserId,
  group,
  friends,
  onClose,
  onInspectPlayer,
  onAddMembers,
  onRemoveMember,
  onRenameGroup,
  onLeaveGroup,
}: GroupManageModalProps) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedNewFriends, setSelectedNewFriends] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (group && open) {
      setGroupName(group.name || '');
      setGroupDesc(group.description || '');
      setEditingInfo(false);
      setSelectedNewFriends([]);
      setConfirmLeave(false);
    }
  }, [group, open]);

  const memberIdSet = useMemo(
    () => new Set((group?.participants ?? []).map((p) => p.id)),
    [group]
  );

  const invitableFriends = useMemo(
    () => friends.filter((f) => !memberIdSet.has(f.user.id)),
    [friends, memberIdSet]
  );

  if (!open || !group) return null;

  const canManageGroup = group.my_role === 'owner' || group.my_role === 'admin';

  const canRemoveTarget = (target: ConversationParticipant): boolean => {
    if (target.id === currentUserId) return false;
    if (!canManageGroup) return false;
    if (target.role === 'owner') return false;
    return true;
  };

  const handleSaveGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setBusyAction(true);
    try {
      await onRenameGroup(groupName.trim(), groupDesc.trim());
      setEditingInfo(false);
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedNewFriends.length === 0) return;
    setBusyAction(true);
    try {
      await onAddMembers(selectedNewFriends);
      setSelectedNewFriends([]);
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="tgc-glass-panel flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-indigo-400/30 shadow-panel-elevated">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/35 bg-indigo-500/20 text-indigo-200">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold uppercase tracking-wider text-white">
                {group.name || 'Grupo Privado'}
              </h2>
              <p className="text-xs text-slate-400">
                {group.participants.length}{' '}
                {group.participants.length === 1 ? 'participante' : 'participantes'} •
                Seu papel:{' '}
                <strong className="text-cyan-300">
                  {group.my_role === 'owner'
                    ? 'Líder'
                    : group.my_role === 'admin'
                      ? 'Admin'
                      : 'Membro'}
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Group Name & Description Edit (for owner/admin) */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            {editingInfo ? (
              <form onSubmit={handleSaveGroupInfo} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Nome do Grupo
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Descrição
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingInfo(false)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busyAction}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Sobre o Grupo
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    {group.description?.trim() || 'Grupo privado de conversa entre amigos.'}
                  </p>
                </div>
                {canManageGroup && (
                  <button
                    type="button"
                    onClick={() => setEditingInfo(true)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-white/10"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Current Participants List */}
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              Participantes do Grupo ({group.participants.length})
            </h3>
            <div className="space-y-2">
              {group.participants.map((part) => {
                const isMe = part.id === currentUserId;
                return (
                  <div
                    key={part.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/75 p-3"
                  >
                    <button
                      type="button"
                      onClick={() => onInspectPlayer(part)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <PlayerAvatar
                        name={part.display_name || part.username}
                        avatarUrl={part.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-display text-base font-bold text-white hover:text-cyan-300">
                            {part.display_name || part.username}
                          </span>
                          {isMe && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                              Você
                            </span>
                          )}
                          {part.role === 'owner' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              <Crown className="h-2.5 w-2.5" /> Líder
                            </span>
                          )}
                          {part.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                              <Shield className="h-2.5 w-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-400">
                          @{part.username} • {part.player_code}
                        </p>
                      </div>
                    </button>

                    {canRemoveTarget(part) && (
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={async () => {
                          setBusyAction(true);
                          try {
                            await onRemoveMember(part.id);
                          } finally {
                            setBusyAction(false);
                          }
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-50"
                        title="Remover participante do grupo"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Friends to Group */}
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              Adicionar Amigos ao Grupo
            </h3>
            {invitableFriends.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs text-slate-400">
                Todos os seus amigos atuais já fazem parte deste grupo (ou adicione
                novos amigos pelo código único na página Amigos).
              </p>
            ) : (
              <div className="space-y-2.5">
                <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {invitableFriends.map((f) => {
                    const selected = selectedNewFriends.includes(f.user.id);
                    return (
                      <button
                        key={f.user.id}
                        type="button"
                        onClick={() =>
                          setSelectedNewFriends((prev) =>
                            prev.includes(f.user.id)
                              ? prev.filter((x) => x !== f.user.id)
                              : [...prev, f.user.id]
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                          selected
                            ? 'border-cyan-400/50 bg-cyan-500/15 text-white'
                            : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <span className="font-semibold">
                          {f.user.display_name || f.user.username}{' '}
                          <span className="font-normal text-slate-400">
                            (@{f.user.username})
                          </span>
                        </span>
                        <span className="text-cyan-300">
                          {selected ? 'Selecionado' : '+ Selecionar'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedNewFriends.length > 0 && (
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={handleAddSelected}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>
                      Adicionar {selectedNewFriends.length}{' '}
                      {selectedNewFriends.length === 1 ? 'Amigo' : 'Amigos'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Leave Group */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/85 px-6 py-4">
          {!confirmLeave ? (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair do Grupo</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-200">Confirmar saída do grupo?</span>
              <button
                type="button"
                disabled={busyAction}
                onClick={async () => {
                  setBusyAction(true);
                  try {
                    await onLeaveGroup();
                  } finally {
                    setBusyAction(false);
                  }
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
              >
                Sim, sair
              </button>
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
