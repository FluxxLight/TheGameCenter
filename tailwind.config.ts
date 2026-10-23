import type { Config } from 'tailwindcss';

const primaryScale = {
  50: 'rgb(var(--tgc-accent-primary-soft) / <alpha-value>)',
  100: 'rgb(var(--tgc-accent-primary-soft) / <alpha-value>)',
  200: 'rgb(var(--tgc-accent-primary-soft) / <alpha-value>)',
  300: 'rgb(var(--tgc-accent-primary) / <alpha-value>)',
  400: 'rgb(var(--tgc-accent-primary) / <alpha-value>)',
  500: 'rgb(var(--tgc-accent-primary) / <alpha-value>)',
  600: 'rgb(var(--tgc-accent-primary) / <alpha-value>)',
  950: 'rgb(var(--tgc-bg-elevated) / <alpha-value>)',
};

const secondaryScale = {
  50: 'rgb(var(--tgc-accent-secondary-soft) / <alpha-value>)',
  100: 'rgb(var(--tgc-accent-secondary-soft) / <alpha-value>)',
  200: 'rgb(var(--tgc-accent-secondary-soft) / <alpha-value>)',
  300: 'rgb(var(--tgc-accent-secondary) / <alpha-value>)',
  400: 'rgb(var(--tgc-accent-secondary) / <alpha-value>)',
  500: 'rgb(var(--tgc-accent-secondary) / <alpha-value>)',
  600: 'rgb(var(--tgc-accent-secondary) / <alpha-value>)',
  950: 'rgb(var(--tgc-bg-elevated) / <alpha-value>)',
};

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
        // Remap primary/secondary brand & surface palettes to live CSS design tokens
        cyan: primaryScale,
        indigo: secondaryScale,
        slate: {
          50: '#f8fafc',
          100: 'rgb(var(--tgc-text-primary) / <alpha-value>)',
          200: 'rgb(var(--tgc-text-primary) / <alpha-value>)',
          300: 'rgb(var(--tgc-text-secondary) / <alpha-value>)',
          400: 'rgb(var(--tgc-text-secondary) / <alpha-value>)',
          500: 'rgb(var(--tgc-text-muted) / <alpha-value>)',
          600: 'rgb(var(--tgc-border) / <alpha-value>)',
          700: 'rgb(var(--tgc-border) / <alpha-value>)',
          800: 'rgb(var(--tgc-bg-elevated) / <alpha-value>)',
          900: 'rgb(var(--tgc-bg-surface) / <alpha-value>)',
          950: 'rgb(var(--tgc-bg-canvas) / <alpha-value>)',
        },
        tgc: {
          canvas: 'rgb(var(--tgc-bg-canvas) / <alpha-value>)',
          surface: 'rgb(var(--tgc-bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--tgc-bg-elevated) / <alpha-value>)',
          card: 'rgb(var(--tgc-bg-card) / <alpha-value>)',
          input: 'rgb(var(--tgc-bg-input) / <alpha-value>)',
          border: 'rgb(var(--tgc-border) / <alpha-value>)',
          primary: 'rgb(var(--tgc-accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--tgc-accent-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--tgc-accent-tertiary) / <alpha-value>)',
          btnfg: 'rgb(var(--tgc-btn-fg) / <alpha-value>)',
          text: 'rgb(var(--tgc-text-primary) / <alpha-value>)',
          muted: 'rgb(var(--tgc-text-secondary) / <alpha-value>)',
          subtle: 'rgb(var(--tgc-text-muted) / <alpha-value>)',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 24px -4px rgb(var(--tgc-accent-primary) / 0.42)',
        'neon-indigo': '0 0 28px -6px rgb(var(--tgc-accent-secondary) / 0.45)',
        'panel-elevated': '0 18px 40px -15px rgba(0, 0, 0, 0.78)',
      },
    },
  },
  plugins: [],
};

export default config;
