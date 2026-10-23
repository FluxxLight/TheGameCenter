'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';

export default function MessagesPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <MessageSquare className="h-6 w-6 text-purple-400" />
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
          Mensagens
        </h1>
      </div>

      <section className="tgc-glass-panel rounded-3xl border border-purple-500/25 p-8 text-center sm:p-12">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-400/35 bg-purple-500/15 px-3.5 py-1 text-xs font-semibold text-purple-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Estrutura Reservada para Próxima Etapa</span>
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          Central de Mensagens &amp; Grupos em Breve
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
          Esta área da navegação principal já está preparada para receber conversas
          diretas entre amigos e grupos de jogatina nas próximas etapas do{' '}
          <strong className="text-white">The Game Center</strong>.
        </p>

        <div className="mt-6">
          <Link
            href="/biblioteca"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/25"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ir para Minha Biblioteca</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
