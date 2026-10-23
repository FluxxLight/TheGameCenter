'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  LogOut,
  Palette,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeId, useTheme } from '@/contexts/ThemeContext';

type SettingsSection = 'aparencia' | 'conta';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { activeTheme, themes, savingTheme, selectTheme } = useTheme();
  const { showToast } = useToast();

  const tabParam = searchParams?.get('tab');
  const [section, setSection] = useState<SettingsSection>(
    tabParam === 'conta' ? 'conta' : 'aparencia'
  );
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (tabParam === 'conta' || tabParam === 'aparencia') {
      setSection(tabParam);
    }
  }, [tabParam]);

  const switchSection = (next: SettingsSection) => {
    setSection(next);
    router.replace(`/configuracoes?tab=${next}`, { scroll: false });
  };

  const handleSelectTheme = async (themeId: ThemeId, themeName: string) => {
    if (themeId === activeTheme) return;
    try {
      await selectTheme(themeId);
      showToast(
        `Tema "${themeName}" aplicado e salvo na sua conta!`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a preferência de tema.',
        'error'
      );
    }
  };

  const handleCopyCode = async () => {
    if (!profile?.player_code) return;
    try {
      await navigator.clipboard.writeText(profile.player_code);
      setCopiedCode(true);
      showToast(`Código ${profile.player_code} copiado!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast(`Código: ${profile.player_code}`, 'info');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showToast('Sessão encerrada com sucesso.', 'info');
      router.replace('/login');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao encerrar sessão.',
        'error'
      );
    }
  };

  const activeThemeObj =
    themes.find((t) => t.id === activeTheme) ?? themes[0];

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-cyan-400" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
              Configurações
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Personalize a aparência visual da plataforma e gerencie sua conta no The
            Game Center.
          </p>
        </div>

        {/* Section Switcher: Configurações -> Aparência | Conta & Segurança */}
        <div
          role="tablist"
          aria-label="Seções de configurações"
          className="inline-flex rounded-2xl border border-white/10 bg-slate-900/90 p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === 'aparencia'}
            onClick={() => switchSection('aparencia')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              section === 'aparencia'
                ? 'tgc-btn-primary'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Aparência</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'conta'}
            onClick={() => switchSection('conta')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              section === 'conta'
                ? 'tgc-btn-primary'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Conta &amp; Segurança</span>
          </button>
        </div>
      </div>

      {section === 'aparencia' ? (
        <div className="space-y-6">
          {/* Active Theme Status Banner */}
          <section className="tgc-glass-panel rounded-3xl border border-cyan-400/30 p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Configurações &rarr; Aparência</span>
                </div>
                <h2 className="mt-2.5 font-display text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
                  Tema Ativo: {activeThemeObj.name}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Paleta:{' '}
                  <strong className="text-cyan-300">
                    {activeThemeObj.paletteLabel}
                  </strong>{' '}
                  • Sua escolha fica salva no seu perfil e permanece ativa ao sair e
                  entrar novamente.
                </p>
              </div>

              {savingTheme && (
                <span className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-200">
                  Sincronizando preferência...
                </span>
              )}
            </div>

            {/* Live Token Preview Bar */}
            <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-slate-950/75 p-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    showToast('Botões primários seguem os tokens do tema!', 'info')
                  }
                  className="tgc-btn-primary rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Botão Primário
                </button>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                  Destaque Ativo
                </span>
              </div>

              <div>
                <input
                  type="text"
                  readOnly
                  value="Campo de formulário sincronizado"
                  aria-label="Exemplo de campo de formulário com tokens do tema"
                  className="w-full rounded-xl border border-white/15 bg-tgc-input px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-400/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-xs text-slate-300">
                <span>Tokens ativos:</span>
                {activeThemeObj.swatches.map((hex, i) => (
                  <span
                    key={`${hex}-${i}`}
                    className="h-5 w-5 rounded-full border border-white/25 shadow-sm"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Theme Selector Grid */}
          <section>
            <h3 className="mb-3.5 font-display text-xl font-bold uppercase tracking-wider text-white">
              Escolha a Identidade Visual da Plataforma
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((theme) => {
                const selected = theme.id === activeTheme;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    disabled={savingTheme}
                    onClick={() => handleSelectTheme(theme.id, theme.name)}
                    aria-pressed={selected}
                    className={`tgc-card-hover group flex flex-col justify-between overflow-hidden rounded-2xl border text-left transition ${
                      selected
                        ? 'border-cyan-400/75 bg-slate-900/95 ring-2 ring-cyan-400/35 shadow-neon-cyan'
                        : 'border-white/10 bg-slate-900/65 hover:border-cyan-400/45'
                    }`}
                  >
                    {/* Miniature UI Preview Header */}
                    <div
                      className="relative h-28 w-full overflow-hidden border-b border-white/10 p-3.5"
                      style={{ backgroundColor: theme.previewBg }}
                    >
                      <div className="flex h-full gap-2.5">
                        {/* Mini Sidebar */}
                        <div
                          className="flex w-12 flex-col gap-1.5 rounded-lg border border-white/10 p-1.5"
                          style={{ backgroundColor: theme.previewCard }}
                        >
                          <div
                            className="h-2.5 w-full rounded"
                            style={{ backgroundColor: theme.previewPrimary }}
                          />
                          <div className="h-2 w-4/5 rounded bg-white/15" />
                          <div className="h-2 w-3/5 rounded bg-white/10" />
                        </div>

                        {/* Mini Content Card */}
                        <div
                          className="flex flex-1 flex-col justify-between rounded-xl border border-white/10 p-2.5"
                          style={{ backgroundColor: theme.previewCard }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="h-2.5 w-20 rounded bg-white/85" />
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: theme.previewSecondary }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-5 w-16 rounded-md"
                              style={{ backgroundColor: theme.previewPrimary }}
                            />
                            <span
                              className="h-5 w-10 rounded-md opacity-75"
                              style={{ backgroundColor: theme.previewSecondary }}
                            />
                          </div>
                        </div>
                      </div>

                      {selected && (
                        <span className="tgc-btn-primary absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                          <Check className="h-3 w-3 stroke-[3]" />
                          Ativo
                        </span>
                      )}
                    </div>

                    {/* Theme Details */}
                    <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-lg font-bold text-white">
                            {theme.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {theme.swatches.map((hex, idx) => (
                              <span
                                key={`${theme.id}-${idx}`}
                                className="h-3.5 w-3.5 rounded-full border border-white/25"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-cyan-300">
                          {theme.paletteLabel}
                        </p>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                          {theme.description}
                        </p>
                      </div>

                      <div className="border-t border-white/10 pt-2.5 text-xs font-semibold text-cyan-300">
                        {selected ? '✓ Tema em uso na sua conta' : 'Aplicar este tema'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        /* Conta & Segurança Tab */
        <section className="tgc-glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                Credenciais da Conta &amp; Isolamento de Dados
              </h2>
            </div>

            <Link
              href="/perfil"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
            >
              <span>Editar Perfil Completo</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-4">
              <dt className="text-xs text-slate-400">E-mail Autenticado</dt>
              <dd className="mt-1 truncate font-medium text-white">
                {user?.email || profile?.email || '—'}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-4">
              <dt className="text-xs text-slate-400">Nome de Usuário</dt>
              <dd className="mt-1 font-medium text-cyan-300">
                @{profile?.username || '—'}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-4">
              <dt className="flex items-center gap-1 text-xs text-slate-400">
                <Fingerprint className="h-3.5 w-3.5 text-cyan-400" />
                Player ID Único
              </dt>
              <dd className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-white">
                  {profile?.player_code || '—'}
                </span>
                {profile?.player_code && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                  >
                    {copiedCode ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <p className="max-w-xl text-xs leading-relaxed text-slate-400">
              Sua biblioteca pessoal, seu histórico de jogos e suas conversas privadas
              estão protegidos por políticas estritas de Row Level Security (RLS) no
              Supabase.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/25"
            >
              <LogOut className="h-4 w-4" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-slate-900/50" />
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
