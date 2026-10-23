'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const nextParam = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${nextParam}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="tgc-cyber-backdrop flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <BrandLogo size="lg" iconOnly className="animate-pulse" />
        <div className="text-center">
          <p className="font-display text-xl font-bold uppercase tracking-widest text-white">
            Sincronizando Central Gamer
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Verificando sessão segura no The Game Center...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
