'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import {
  checkUsernameAvailability,
  getOrEnsureProfile,
} from '@/services/profileService';
import { Profile } from '@/types/database';

interface SignUpParams {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUpWithEmail: (params: SignUpParams) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileState: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Faça login ou utilize outro endereço.';
  }
  if (lower.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de acessar sua conta.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.';
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return 'Informe um endereço de e-mail válido.';
  }
  return message || 'Ocorreu um erro na autenticação.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfileForUser = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    try {
      const loaded = await getOrEnsureProfile(authUser);
      setProfile(loaded);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfileForUser(currentSession.user);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Falha ao restaurar sessão:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        await loadProfileForUser(nextUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForUser]);

  const signUpWithEmail = useCallback(
    async ({ email, password, username, displayName }: SignUpParams) => {
      const cleanedEmail = email.trim().toLowerCase();
      const cleanedUsername = username.trim();
      const cleanedDisplay = displayName.trim() || cleanedUsername;

      const availability = await checkUsernameAvailability(cleanedUsername);
      if (!availability.available) {
        throw new Error(availability.reason || 'Nome de usuário indisponível.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanedEmail,
        password,
        options: {
          data: {
            username: cleanedUsername,
            display_name: cleanedDisplay,
          },
        },
      });

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await loadProfileForUser(data.session.user);
      }
    },
    [loadProfileForUser]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(translateAuthError(error.message));
      }

      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        await loadProfileForUser(data.session.user);
      }
    },
    [loadProfileForUser]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(translateAuthError(error.message));
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfileForUser(user);
    }
  }, [user, loadProfileForUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      refreshProfile,
      setProfileState: setProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return ctx;
}
