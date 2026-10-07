import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf5', 100: '#c9d3e8', 200: '#a8b8d6', 300: '#7d97bf',
          400: '#5476a8', 500: '#2b5591', 600: '#1a3e75', 700: '#132e59',
          800: '#0d1f3c', 900: '#07111f', 950: '#030a11',
        },
        charcoal: {
          300: '#c0c5d0', 400: '#9aa0b0', 500: '#747b8a', 600: '#535a68',
          700: '#363c4a', 800: '#1e2330', 900: '#13161e',
        },
        gold: {
          100: '#f7e8c0', 200: '#f0d48e', 300: '#e8c060', 400: '#d4a843',
          500: '#c09030', 600: '#9a7020', 700: '#7a5410', 800: '#5a3c06', 900: '#3c2800',
        },
        ivory: { 100: '#f8f4ea', 200: '#ede8d8', 300: '#e1dac6' },
        'legal-red': '#c0392b',
        'legal-green': '#1a6b47',
        'legal-blue': '#2563eb',
        'legal-amber': '#b45309',
        'legal-purple': '#7c3aed',
        'text-2xs': '#8891a4',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        legal: '0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(212, 168, 67, 0.15)',
        'glow-red': '0 0 20px rgba(192, 57, 43, 0.2)',
        'glow-green': '0 0 20px rgba(26, 107, 71, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'timer-warning': 'timerWarning 1s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        timerWarning: { '0%,100%': { backgroundColor: 'transparent' }, '50%': { backgroundColor: 'rgba(192,57,43,0.08)' } },
        pulseGold: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
export default config;
