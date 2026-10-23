'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  XCircle,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { validateUsernameFormat } from '@/lib/validation/gameValidation';
import { checkUsernameAvailability } from '@/services/profileService';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading, signUpWithEmail } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [usernameState, setUsernameState] = useState<{
    checking: boolean;
    available: boolean | null;
    message?: string;
  }>({ checking: false, available: null });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameState({ checking: false, available: null });
      return;
    }

    const formatErr = validateUsernameFormat(trimmed);
    if (formatErr) {
      setUsernameState({ checking: false, available: false, message: formatErr });
      return;
    }

    let cancelled = false;
    setUsernameState({ checking: true, available: null });

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(trimmed);
        if (!cancelled) {
          setUsernameState({
            checking: false,
            available: res.available,
            message: res.available
              ? 'Nome de usuário disponível!'
              : res.reason || 'Indisponível.',
          });
        }
      } catch {
        if (!cancelled) {
          setUsernameState({ checking: false, available: null });
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formatErr = validateUsernameFormat(username);
    if (formatErr) {
      setErrorMessage(formatErr);
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail({
        email,
        password,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      });
      showToast(
        'Conta criada com sucesso! Seu Código Único de Jogador foi gerado.',
        'success'
      );
      router.replace('/dashboard');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erro ao criar conta.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tgc-cyber-backdrop flex min-h-screen flex-col justify-between px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        <BrandLogo href="/" size="sm" />
      </div>

      <div className="my-auto flex items-center justify-center py-6">
        <div className="tgc-glass-panel w-full max-w-lg rounded-3xl border border-cyan-400/25 p-6 shadow-panel-elevated sm:p-8">
          <div className="flex flex-col items-center text-center">
            <BrandLogo href="/" size="lg" iconOnly />
            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wider text-white">
              Criar Identidade Gamer
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Cadastre-se para organizar sua biblioteca e receber seu{' '}
              <span className="text-cyan-300">Player ID único</span>.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signup-displayname"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Nome de Exibição
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="signup-displayname"
                    type="text"
                    maxLength={80}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: Alex Mercer"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-username"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Nome de Usuário <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input
                    id="signup-username"
                    type="text"
                    required
                    maxLength={30}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seu_nick"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameState.checking && (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    )}
                    {!usernameState.checking && usernameState.available === true && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {!usernameState.checking && usernameState.available === false && (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                </div>
                {usernameState.message && (
                  <p
                    className={`mt-1 text-[11px] ${
                      usernameState.available
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {usernameState.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                E-mail <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Senha <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Alternar visibilidade da senha"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Confirmar Senha <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full rounded-xl border border-white/15 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || usernameState.available === false}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-neon-cyan transition hover:brightness-110 disabled:opacity-60"
            >
              <span>{submitting ? 'Criando Conta...' : 'Finalizar Cadastro Gamer'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 border-t border-white/10 pt-5 text-center text-sm text-slate-400">
            Já possui cadastro no The Game Center?{' '}
            <Link
              href="/login"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        The Game Center • Código único gerado automaticamente no registro
      </div>
    </div>
  );
}
