import type { Metadata } from 'next';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: {
    default: 'The Game Center — Biblioteca Pessoal & Plataforma Gamer',
    template: '%s | The Game Center',
  },
  description:
    'The Game Center combina sua biblioteca pessoal de jogos, histórico de jornada gamer e identidade social em um único ecossistema.',
  icons: {
    icon: '/brand/tgc-icon.png',
    shortcut: '/brand/tgc-icon.png',
    apple: '/brand/tgc-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="obsidian-cyber">
      <body className="antialiased selection:bg-cyan-400/25 selection:text-cyan-200">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
