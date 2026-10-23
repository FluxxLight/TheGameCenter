'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/profileService';

export type ThemeId =
  | 'obsidian-cyber'
  | 'purple-orange-graphite'
  | 'green-black-white'
  | 'blue-white-black'
  | 'neon-dark-green'
  | 'cyber-pink-cyan-yellow'
  | 'red-black-graphite';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  paletteLabel: string;
  description: string;
  swatches: [string, string, string, string];
  previewBg: string;
  previewCard: string;
  previewPrimary: string;
  previewSecondary: string;
}

export const TGC_THEMES: readonly ThemeDefinition[] = [
  {
    id: 'obsidian-cyber',
    name: 'Obsidian Nexus (Oficial)',
    paletteLabel: 'Ciano Elétrico + Índigo + Obsidiana',
    description:
      'Identidade original inspirada diretamente no emblema oficial do The Game Center.',
    swatches: ['#070A12', '#0F1524', '#00E5FF', '#6366F1'],
    previewBg: '#070A12',
    previewCard: '#0F1524',
    previewPrimary: '#00E5FF',
    previewSecondary: '#6366F1',
  },
  {
    id: 'purple-orange-graphite',
    name: 'Nebula Flare',
    paletteLabel: 'Roxo + Laranja + Grafite + Branco',
    description:
      'Contraste energético entre roxo arcano e laranja solar sobre chassi grafite.',
    swatches: ['#121318', '#262934', '#A855F7', '#F97316'],
    previewBg: '#121318',
    previewCard: '#1E202A',
    previewPrimary: '#A855F7',
    previewSecondary: '#F97316',
  },
  {
    id: 'green-black-white',
    name: 'Titan Green',
    paletteLabel: 'Verde + Preto + Branco',
    description:
      'Estética limpa de console competitivo com verde intenso, preto puro e tipografia branca.',
    swatches: ['#060707', '#161A18', '#22C55E', '#FFFFFF'],
    previewBg: '#060707',
    previewCard: '#0F1211',
    previewPrimary: '#22C55E',
    previewSecondary: '#FFFFFF',
  },
  {
    id: 'blue-white-black',
    name: 'Cobalt Pulse',
    paletteLabel: 'Azul + Branco + Preto',
    description:
      'Visual imersivo de próxima geração em azul cobalto elétrico, branco cristalino e preto profundo.',
    swatches: ['#05070C', '#121A2C', '#3B82F6', '#FFFFFF'],
    previewBg: '#05070C',
    previewCard: '#0D1321',
    previewPrimary: '#3B82F6',
    previewSecondary: '#E2E8F0',
  },
  {
    id: 'neon-dark-green',
    name: 'Venom Matrix',
    paletteLabel: 'Verde Neon + Verde Escuro + Preto',
    description:
      'Atmosfera sci-fi tática com superfícies verde-escuro e luminescência verde neon.',
    swatches: ['#030906', '#0D2618', '#39FF14', '#10B981'],
    previewBg: '#030906',
    previewCard: '#0A1D13',
    previewPrimary: '#39FF14',
    previewSecondary: '#10B981',
  },
  {
    id: 'cyber-pink-cyan-yellow',
    name: 'Cyber Overdrive',
    paletteLabel: 'Rosa/Vermelho + Ciano + Amarelo + Preto',
    description:
      'Alta voltagem cyberpunk combinando rosa/vermelho neon, ciano elétrico e destaques amarelos.',
    swatches: ['#07060B', '#FF2A6D', '#05D9E8', '#FCEE0A'],
    previewBg: '#07060B',
    previewCard: '#130F1E',
    previewPrimary: '#FF2A6D',
    previewSecondary: '#05D9E8',
  },
  {
    id: 'red-black-graphite',
    name: 'Crimson Vanguard',
    paletteLabel: 'Vermelho + Preto + Branco + Grafite',
    description:
      'Identidade esports agressiva em vermelho carmesim, grafite escovado, preto e branco.',
    swatches: ['#08080A', '#1F2129', '#EF4444', '#FFFFFF'],
    previewBg: '#08080A',
    previewCard: '#17181E',
    previewPrimary: '#EF4444',
    previewSecondary: '#E4E4E7',
  },
] as const;

const VALID_THEME_IDS = new Set<string>(TGC_THEMES.map((t) => t.id));

function normalizeThemeId(raw?: string | null): ThemeId {
  if (!raw) return 'obsidian-cyber';
  if (raw === 'crimson-vanguard') return 'red-black-graphite';
  if (raw === 'emerald-matrix') return 'neon-dark-green';
  if (VALID_THEME_IDS.has(raw)) return raw as ThemeId;
  return 'obsidian-cyber';
}

interface ThemeContextValue {
  activeTheme: ThemeId;
  themes: readonly ThemeDefinition[];
  savingTheme: boolean;
  selectTheme: (nextTheme: ThemeId) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  activeTheme: 'obsidian-cyber',
  themes: TGC_THEMES,
  savingTheme: false,
  selectTheme: async () => {},
});

export function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, setProfileState } = useAuth();
  const [activeTheme, setActiveTheme] = useState<ThemeId>('obsidian-cyber');
  const [savingTheme, setSavingTheme] = useState(false);

  // Sync theme whenever user/profile loads or changes (persists across logout & login per user!)
  useEffect(() => {
    if (profile?.theme_preference) {
      const resolved = normalizeThemeId(profile.theme_preference);
      setActiveTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
      if (user?.id) {
        try {
          localStorage.setItem(`tgc-theme-${user.id}`, resolved);
        } catch {
          // ignore storage quota errors
        }
      }
      return;
    }

    if (user?.id) {
      try {
        const cached = localStorage.getItem(`tgc-theme-${user.id}`);
        if (cached) {
          const resolved = normalizeThemeId(cached);
          setActiveTheme(resolved);
          document.documentElement.setAttribute('data-theme', resolved);
          return;
        }
      } catch {
        // ignore
      }
    }

    // Logged out / default state
    setActiveTheme('obsidian-cyber');
    document.documentElement.setAttribute('data-theme', 'obsidian-cyber');
  }, [user?.id, profile?.theme_preference]);

  const selectTheme = useCallback(
    async (nextTheme: ThemeId) => {
      const resolved = normalizeThemeId(nextTheme);
      const previousTheme = activeTheme;

      // Apply immediately to DOM for instant visual feedback
      setActiveTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);

      if (!user) return;

      try {
        localStorage.setItem(`tgc-theme-${user.id}`, resolved);
      } catch {
        // ignore
      }

      setSavingTheme(true);
      try {
        const updatedProfile = await updateUserProfile(user.id, {
          theme_preference: resolved,
        });
        setProfileState(updatedProfile);
      } catch (err) {
        // Revert on DB failure
        setActiveTheme(previousTheme);
        document.documentElement.setAttribute('data-theme', previousTheme);
        throw err;
      } finally {
        setSavingTheme(false);
      }
    },
    [activeTheme, user, setProfileState]
  );

  const value = useMemo(
    () => ({
      activeTheme,
      themes: TGC_THEMES,
      savingTheme,
      selectTheme,
    }),
    [activeTheme, savingTheme, selectTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
