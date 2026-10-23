'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInWithEmail } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rawNext = searchParams?.get('next') || '/dashboard';
  const safeNext =
    rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  useEffect(() => {
    if (!loading && user) {
      router.replace(safeNext);
    }
  }, [loading, user, router, safeNext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail.');
      return;
    }
    if (!password) {
      setErrorMessage('Informe sua senha.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      showToast('Bem-vindo de volta ao The Game Center!', 'success');
      router.replace(safeNext);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao realizar login.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tgc-glass-panel w-full max-w-md rounded-3xl border border-cyan-400/25 p-6 shadow-panel-elevated sm:p-8">
      <div className="flex flex-col items-center text-center">
        <BrandLogo href="/" size="lg" iconOnly />
        <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wider text-white">
          Acessar Conta
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Entre no <strong className="text-slate-200">The Game Center</strong> para
          acessar sua biblioteca pessoal.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
        >
          <span>{submitting ? 'Autenticando...' : 'Entrar na Plataforma'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>Autenticação protegida via Supabase Auth</span>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5 text-center text-sm text-slate-400">
        Ainda não tem uma conta?{' '}
        <Link
          href="/cadastro"
          className="font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline"
        >
          Criar conta grátis
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="tgc-cyber-backdrop flex min-h-screen flex-col justify-between px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        <BrandLogo href="/" size="sm" />
      </div>

      <div className="my-auto flex items-center justify-center py-8">
        <Suspense
          fallback={
            <div className="tgc-glass-panel h-96 w-full max-w-md animate-pulse rounded-3xl" />
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>

      <div className="text-center text-xs text-slate-500">
        The Game Center • Biblioteca Pessoal &amp; Identidade Gamer
      </div>
    </div>
  );
}
