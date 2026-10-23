'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 'obsidian-cyber' | 'crimson-vanguard' | 'emerald-matrix';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  swatches: [string, string, string];
  availableNow: boolean;
}

export const TGC_THEMES: readonly ThemeDefinition[] = [
  {
    id: 'obsidian-cyber',
    name: 'Obsidian Nexus (Padrão Oficial)',
    description: 'Identidade principal inspirada no emblema oficial ciano elétrico e índigo.',
    swatches: ['#070A12', '#00E5FF', '#6366F1'],
    availableNow: true,
  },
  {
    id: 'crimson-vanguard',
    name: 'Crimson Vanguard',
    description: 'Variante tática carmesim — preparada na arquitetura para a etapa de temas.',
    swatches: ['#0C080C', '#F43F5E', '#F97316'],
    availableNow: false,
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Variante furtiva esmeralda — preparada na arquitetura para a etapa de temas.',
    swatches: ['#060D0B', '#10B981', '#06B6D4'],
    availableNow: false,
  },
] as const;

interface ThemeContextValue {
  activeTheme: ThemeId;
  themes: readonly ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue>({
  activeTheme: 'obsidian-cyber',
  themes: TGC_THEMES,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme] = useState<ThemeId>('obsidian-cyber');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, themes: TGC_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
