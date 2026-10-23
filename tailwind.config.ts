import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        tgc: {
          canvas: 'rgb(var(--tgc-bg-canvas) / <alpha-value>)',
          surface: 'rgb(var(--tgc-bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--tgc-bg-elevated) / <alpha-value>)',
          card: 'rgb(var(--tgc-bg-card) / <alpha-value>)',
          border: 'rgb(var(--tgc-border) / <alpha-value>)',
          primary: 'rgb(var(--tgc-accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--tgc-accent-secondary) / <alpha-value>)',
          accent: 'rgb(var(--tgc-accent-tertiary) / <alpha-value>)',
          text: 'rgb(var(--tgc-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--tgc-text-secondary) / <alpha-value>)',
          subtle: 'rgb(var(--tgc-text-muted) / <alpha-value>)',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 24px -4px rgba(0, 229, 255, 0.35)',
        'neon-indigo': '0 0 28px -6px rgba(99, 102, 241, 0.45)',
        'panel-elevated': '0 18px 40px -15px rgba(0, 0, 0, 0.72)',
      },
    },
  },
  plugins: [],
};

export default config;
