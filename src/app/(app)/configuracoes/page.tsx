'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Palette, Settings, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { activeTheme, themes } = useTheme();
  const { showToast } = useToast();

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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-cyan-400" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
            Configurações
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Credenciais da conta, segurança de sessão e arquitetura visual do The Game
          Center.
        </p>
      </div>

      {/* Account & Security */}
      <section className="tgc-glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
            Conta &amp; Segurança
          </h2>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <dt className="text-xs text-slate-400">E-mail Autenticado</dt>
            <dd className="mt-1 truncate font-medium text-white">
              {user?.email || profile?.email || '—'}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <dt className="text-xs text-slate-400">Nome de Usuário</dt>
            <dd className="mt-1 font-medium text-cyan-300">
              @{profile?.username || '—'}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <dt className="text-xs text-slate-400">Player ID Único</dt>
            <dd className="mt-1 font-mono font-bold text-white">
              {profile?.player_code || '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="text-xs text-slate-400">
            Sua biblioteca pessoal está protegida por Row Level Security (RLS) no
            Supabase, garantindo isolamento total dos seus dados.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/25"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair desta Sessão</span>
          </button>
        </div>
      </section>

      {/* Theme Architecture Preview */}
      <section className="tgc-glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Palette className="h-5 w-5 text-cyan-400" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
            Sistema Visual &amp; Temas
          </h2>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          A arquitetura de tokens CSS do The Game Center já está preparada para
          múltiplos temas. O seletor completo de personalização será liberado em etapa
          futura.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {themes.map((t) => {
            const isCurrent = t.id === activeTheme;
            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-4 ${
                  isCurrent
                    ? 'border-cyan-400/50 bg-slate-950/90 shadow-neon-cyan'
                    : 'border-white/10 bg-slate-950/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {t.swatches.map((hex) => (
                      <span
                        key={hex}
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isCurrent
                        ? 'bg-cyan-500/20 text-cyan-200'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {isCurrent ? 'Ativo' : 'Em breve'}
                  </span>
                </div>
                <p className="mt-3 font-display text-base font-bold text-white">
                  {t.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">{t.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
