'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Check,
  Compass,
  Copy,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/biblioteca', label: 'Minha Biblioteca', Icon: Library },
  { href: '/jogos', label: 'Explorar Jogos', Icon: Compass },
  { href: '/perfil', label: 'Meu Perfil', Icon: UserCircle2 },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/amigos', label: 'Amigos', Icon: Users, badge: 'Em breve' },
  { href: '/mensagens', label: 'Mensagens', Icon: MessageSquare, badge: 'Em breve' },
  { href: '/configuracoes', label: 'Configurações', Icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(`${href}/`));

  const handleCopyCode = async () => {
    if (!profile?.player_code) return;
    try {
      await navigator.clipboard.writeText(profile.player_code);
      setCopiedCode(true);
      showToast(`Código ${profile.player_code} copiado!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast(`Seu código: ${profile.player_code}`, 'info');
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      showToast('Sessão encerrada com segurança.', 'info');
      router.replace('/login');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao sair da conta.',
        'error'
      );
      setSigningOut(false);
    }
  };

  const initials = (profile?.display_name || profile?.username || user?.email || 'TG')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="tgc-cyber-backdrop flex min-h-screen flex-col md:flex-row">
      {/* Desktop Command Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-72 md:flex-col md:border-r md:border-white/10 md:bg-slate-950/90 md:backdrop-blur-xl">
        <div className="border-b border-white/10 px-6 py-5">
          <BrandLogo href="/dashboard" size="md" showTagline />
        </div>

        {/* Player Identity Card */}
        <div className="border-b border-white/10 p-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-indigo-950/40 p-3.5">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-11 w-11 rounded-xl border border-cyan-400/40 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-indigo-500/30 font-display text-base font-bold text-cyan-200">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-white">
                  {profile?.display_name || ' Carregando...'}
                </p>
                <p className="truncate text-xs text-cyan-300">
                  @{profile?.username || 'jogador'}
                </p>
              </div>
            </div>

            {profile?.player_code && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/80 px-3 py-1.5 text-left transition hover:border-cyan-400/40"
                title="Copiar seu ID/Código Único de Jogador"
              >
                <div>
                  <span className="block text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                    Player ID Único
                  </span>
                  <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
                    {profile.player_code}
                  </span>
                </div>
                {copiedCode ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Central Gamer
            </p>
            <ul className="space-y-1">
              {PRIMARY_NAV.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border border-cyan-400/35 bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-white shadow-neon-cyan'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? 'text-cyan-300' : 'text-slate-400'}`}
                      />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Social &amp; Sistema
            </p>
            <ul className="space-y-1">
              {SECONDARY_NAV.map(({ href, label, Icon, badge }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border border-cyan-400/35 bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            active ? 'text-cyan-300' : 'text-slate-400'
                          }`}
                        />
                        <span>{label}</span>
                      </span>
                      {badge && (
                        <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2 px-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sessão criptografada &amp; isolada</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            <span>{signingOut ? 'Saindo...' : 'Encerrar Sessão'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <BrandLogo href="/dashboard" size="sm" />
        <div className="flex items-center gap-2">
          {profile?.player_code && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-cyan-200"
            >
              {profile.player_code}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 p-5 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <BrandLogo href="/dashboard" size="sm" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <p className="font-display text-lg font-bold text-white">
              {profile?.display_name}
            </p>
            <p className="text-xs text-cyan-300">@{profile?.username}</p>
            {profile?.player_code && (
              <p className="mt-2 font-mono text-xs text-slate-300">
                ID: <strong>{profile.player_code}</strong>
              </p>
            )}
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map(({ href, label, Icon, badge }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
                    active
                      ? 'border border-cyan-400/35 bg-cyan-500/15 text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-cyan-400" />
                    <span>{label}</span>
                  </span>
                  {badge && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 py-3 text-sm font-semibold text-rose-200"
          >
            <LogOut className="h-4 w-4" />
            <span>{signingOut ? 'Saindo...' : 'Encerrar Sessão'}</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pl-72 md:pb-10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Mobile Bottom Quick Dock */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur-xl md:hidden">
        {PRIMARY_NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition ${
                active ? 'text-cyan-300' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label.replace('Minha ', '').replace('Meu ', '')}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
