'use client';

import React, { useState } from 'react';
import { Check, Copy, Fingerprint, Sparkles, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';

export default function FriendsPlaceholderPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!profile?.player_code) return;
    try {
      await navigator.clipboard.writeText(profile.player_code);
      setCopied(true);
      showToast(`Código ${profile.player_code} copiado!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(`Seu código: ${profile.player_code}`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Users className="h-6 w-6 text-indigo-400" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
          Amigos &amp; Conexões
        </h1>
      </div>

      <section className="tgc-glass-panel rounded-3xl border border-indigo-500/25 p-8 text-center sm:p-12">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-400/35 bg-indigo-500/15 px-3.5 py-1 text-xs font-semibold text-indigo-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Módulo Social Preparado na Arquitetura</span>
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          Sua Identidade Social Já Está Pronta
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
          O sistema de amizades, busca por código e atividade social será ativado na
          etapa social do <strong className="text-white">The Game Center</strong>. Seu{' '}
          <strong className="text-cyan-300">Player ID único</strong> já está ativo e
          reservado na sua conta:
        </p>

        {profile?.player_code && (
          <div className="mx-auto mt-6 flex max-w-sm items-center justify-between rounded-2xl border border-cyan-400/35 bg-slate-950/90 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <Fingerprint className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-lg font-bold tracking-wider text-white">
                {profile.player_code}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
