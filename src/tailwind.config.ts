import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fond: { DEFAULT: '#070D18', 1: '#0C1425', 2: '#111D33', 3: '#182844', hover: '#1A3055' },
        or: { DEFAULT: '#C4973B', dim: '#9A7730', glow: 'rgba(196,151,59,0.12)' },
        bleu: { DEFAULT: '#1B3E7C' },
        rouge: { DEFAULT: '#B32134' },
        texte: { DEFAULT: '#E2E8F0', 2: '#8B9DC3', 3: '#576B8A' },
        border: { DEFAULT: '#1A2A45', 2: '#243A5C' },
        // Rank colors
        rank: {
          1: '#4A5670', 2: '#6B7B9C', 3: '#1B3E7C', 4: '#2E5AA8',
          5: '#8B6A42', 6: '#A67C4E', 7: '#D43A4F', 8: '#B32134', 9: '#C9994F',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '12px', sm: '8px', xs: '6px' },
      maxWidth: { app: '1520px' },
      animation: {
        'fade-in': 'fadeIn 0.15s ease',
        'slide-up': 'slideUp 0.25s ease',
        'slide-right': 'slideRight 0.2s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
