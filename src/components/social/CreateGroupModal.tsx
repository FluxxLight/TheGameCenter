'use client';

import React, { useMemo, useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import { PlayerAvatar } from '@/components/social/PlayerAvatar';
import { FriendEntry } from '@/types/social';

interface CreateGroupModalProps {
  open: boolean;
  friends: FriendEntry[];
  onClose: () => void;
  onCreate: (params: {
    name: string;
    description: string;
    memberIds: string[];
  }) => Promise<void>;
}

export function CreateGroupModal({
  open,
  friends,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const hay =
        `${f.user.display_name} ${f.user.username} ${f.user.player_code}`.toLowerCase();
      return hay.includes(q);
    });
  }, [friends, search]);

  if (!open) return null;

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Defina um nome para o grupo.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        memberIds: selectedIds,
      });
      setName('');
      setDescription('');
      setSearch('');
      setSelectedIds([]);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar grupo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="tgc-glass-panel flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-indigo-400/30 shadow-panel-elevated">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/75 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                Criar Grupo de Conversa
              </h2>
              <p className="text-xs text-slate-400">
                Grupo privado exclusivo entre amigos do The Game Center
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

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Nome do Grupo <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              maxLength={80}
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Squad Raid de Sexta, Clã Elden Ring..."
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Descrição / Tópico (opcional)
            </label>
            <input
              type="text"
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Coordenação de partidas cooperativas e call"
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Convidar Amigos ({selectedIds.length} selecionados)
              </label>
              <span className="text-[11px] text-slate-500">
                Você também pode adicionar depois
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
                Você ainda não tem amigos confirmados na lista. Você pode criar o grupo
                agora e adicionar amigos assim que aceitarem seu convite!
              </div>
            ) : (
              <>
                <div className="relative mb-2.5">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar amigos..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                  />
                </div>

                <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                  {filteredFriends.map((f) => {
                    const checked = selectedIds.includes(f.user.id);
                    return (
                      <button
                        key={f.user.id}
                        type="button"
                        onClick={() => toggleFriend(f.user.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition ${
                          checked
                            ? 'border-cyan-400/50 bg-cyan-500/15'
                            : 'border-white/10 bg-slate-950/70 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PlayerAvatar
                            name={f.user.display_name || f.user.username}
                            avatarUrl={f.user.avatar_url}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {f.user.display_name || f.user.username}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              @{f.user.username} • {f.user.player_code}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            checked
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                              : 'border-white/20 bg-slate-900'
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? 'Criando Grupo...' : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
