'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Fingerprint,
  Flame,
  Gamepad2,
  History,
  Layers,
  Library,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user, profile, loading } = useAuth();

  return (
    <div className="tgc-cyber-backdrop min-h-screen flex flex-col">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <BrandLogo href="/" size="md" showTagline />

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <a href="#recursos" className="transition hover:text-cyan-300">
              Recursos
            </a>
            <a href="#jornada" className="transition hover:text-cyan-300">
              Jornada &amp; Histórico
            </a>
            <a href="#identidade" className="transition hover:text-cyan-300">
              Identidade Gamer
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {!loading && user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 sm:px-5 sm:py-2.5"
              >
                <span>Ir para Central ({profile?.username || 'Conta'})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 sm:px-4 sm:py-2.5"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 sm:px-5 sm:py-2.5"
                >
                  <span>Criar Conta</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Plataforma Gamer • Biblioteca Pessoal &amp; Identidade Social</span>
            </div>

            <h1 className="mt-6 font-display text-4xl font-bold uppercase leading-[1.04] tracking-wide text-white sm:text-5xl lg:text-6xl">
              Domine cada jogo da sua{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                jornada gamer
              </span>{' '}
              em um só comando.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Organize sua coleção em qualquer plataforma, acompanhe horas jogadas,
              registre quando começou e zerou cada título e garanta seu{' '}
              <strong className="text-white">Código Único de Jogador</strong> no{' '}
              <strong className="text-cyan-300">The Game Center</strong>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href={user ? '/dashboard' : '/cadastro'}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110"
              >
                <span>{user ? 'Acessar Meu Dashboard' : 'Começar Gratuitamente'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
                >
                  <span>Já tenho uma conta</span>
                </Link>
              )}
            </div>

            {/* Status Pillars Preview */}
            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Controle Completo de Status da Biblioteca
              </p>
              <div className="flex flex-wrap gap-2.5">
                <StatusBadge status="Jogando" />
                <StatusBadge status="Zerei" />
                <StatusBadge status="Quero Jogar" />
                <StatusBadge status="Abandonei" />
              </div>
            </div>
          </div>

          {/* Right Tactical HUD Mockup */}
          <div className="lg:col-span-5">
            <div className="tgc-glass-panel relative rounded-3xl border border-cyan-400/25 p-5 shadow-panel-elevated sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/brand/tgc-icon.png"
                    alt="Emblema The Game Center"
                    className="h-11 w-11 rounded-xl border border-cyan-400/35 object-cover shadow-neon-cyan"
                  />
                  <div>
                    <p className="font-display text-base font-bold uppercase tracking-wider text-white">
                      Perfil TGC Ativo
                    </p>
                    <p className="font-mono text-xs text-cyan-300">ID: TGC-8K4M-92QX</p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Online
                </span>
              </div>

              {/* Sample Active Library Entries */}
              <div className="mt-4 space-y-3">
                {[
                  {
                    title: 'Elden Ring',
                    platform: 'PC • RPG de Ação',
                    status: 'Zerei' as const,
                    hours: '118.5h',
                    rating: '10.0',
                  },
                  {
                    title: 'Clair Obscur: Expedition 33',
                    platform: 'PlayStation 5 • RPG por Turnos',
                    status: 'Jogando' as const,
                    hours: '34.0h',
                    rating: '9.5',
                  },
                  {
                    title: 'Hollow Knight',
                    platform: 'Nintendo Switch • Metroidvania',
                    status: 'Quero Jogar' as const,
                    hours: '0h',
                    rating: null,
                  },
                ].map((sample) => (
                  <div
                    key={sample.title}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/75 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-white">
                        {sample.title}
                      </p>
                      <p className="truncate text-xs text-slate-400">{sample.platform}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={sample.status} size="sm" />
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          {sample.hours}
                        </span>
                        {sample.rating && (
                          <span className="inline-flex items-center gap-0.5 text-amber-300">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {sample.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Timeline Preview */}
              <div className="mt-4 rounded-2xl border border-indigo-500/25 bg-indigo-950/20 p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                  <History className="h-3.5 w-3.5" />
                  <span>Linha do Tempo Pessoal Automática</span>
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Cada adição, início de campanha, mudança de status e conclusão fica
                  registrada cronologicamente na página individual do jogo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="recursos" className="border-t border-white/10 bg-slate-950/50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
              Arquitetura Gamer Completa
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Projetado para colecionadores, estrategistas e exploradores
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: Library,
                title: 'Biblioteca Pessoal Isolada',
                description:
                  'Sua coleção pertence somente a você, com isolamento rigoroso por usuário no banco de dados e sincronização em tempo real.',
              },
              {
                Icon: Gamepad2,
                title: 'Catálogo Integrado + Cadastro Manual',
                description:
                  'Pesquise clássicos e lançamentos rapidamente ou cadastre qualquer jogo indie, mod ou retrô manualmente sem depender de APIs externas.',
              },
              {
                Icon: History,
                title: 'Histórico Pessoal por Jogo',
                description:
                  'Acompanhe automaticamente quando adicionou o jogo, quando começou a jogar, mudanças de status e a data em que zerou.',
              },
              {
                Icon: Fingerprint,
                title: 'Player ID / Código Único',
                description:
                  'Cada conta recebe automaticamente um código exclusivo TGC para identificação rápida e conexão nas áreas sociais.',
              },
              {
                Icon: Flame,
                title: 'Dashboard de Telemetria Gamer',
                description:
                  'Visualize os títulos que está jogando agora, últimos jogos adicionados, campanhas zeradas, média de notas e horas acumuladas.',
              },
              {
                Icon: Layers,
                title: 'Fundação Pronta para Evolução',
                description:
                  'Navegação estruturada e sistema de tokens preparado para futuros temas personalizados, lista de amigos e mensagens.',
              },
            ].map(({ Icon, title, description }) => (
              <div
                key={title}
                className="tgc-glass-panel tgc-card-hover rounded-2xl p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold tracking-wide text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey & Identity Highlight */}
      <section id="jornada" className="border-t border-white/10 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div
            id="identidade"
            className="tgc-glass-panel rounded-3xl border border-cyan-500/20 p-7 sm:p-8"
          >
            <div className="flex items-center gap-3 text-cyan-300">
              <Shield className="h-6 w-6" />
              <span className="font-display text-lg font-bold uppercase tracking-wider">
                Identidade Oficial &amp; Privacidade
              </span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              Seu @username único + Código TGC exclusivo
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Ao criar sua conta com e-mail e senha, o The Game Center gera
              instantaneamente seu identificador único (ex:{' '}
              <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-cyan-300">
                TGC-7F9K-4M2X
              </code>
              ) e protege sua biblioteca com políticas de segurança em nível de linha no
              Supabase.
            </p>
          </div>

          <div className="tgc-glass-panel rounded-3xl border border-indigo-500/25 p-7 sm:p-8">
            <div className="flex items-center gap-3 text-indigo-300">
              <Users className="h-6 w-6" />
              <span className="font-display text-lg font-bold uppercase tracking-wider">
                Ecossistema em Expansão Contínua
              </span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              Biblioteca hoje, rede gamer completa amanhã
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Comece catalogando todos os jogos que já zerou e sua fila de próximos
              desafios. Sua conta já nasce pronta para as próximas etapas de conexões de
              amigos, mensagens diretas e customização de temas.
            </p>
            <div className="mt-6">
              <Link
                href={user ? '/biblioteca' : '/cadastro'}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/25"
              >
                <Trophy className="h-4 w-4" />
                <span>{user ? 'Abrir Minha Biblioteca' : 'Criar Meu Perfil Gamer'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950/90 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <BrandLogo size="sm" />
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} The Game Center. Plataforma pessoal de
            biblioteca gamer e identidade social.
          </p>
        </div>
      </footer>
    </div>
  );
}
