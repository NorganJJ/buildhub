import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Серая шкала через CSS-переменные — позволяет переключать тёмную/светлую тему
        // без изменения компонентов (см. index.css: :root и :root[data-theme="light"]).
        gray: {
          50: 'rgb(var(--g-50) / <alpha-value>)',
          100: 'rgb(var(--g-100) / <alpha-value>)',
          200: 'rgb(var(--g-200) / <alpha-value>)',
          300: 'rgb(var(--g-300) / <alpha-value>)',
          400: 'rgb(var(--g-400) / <alpha-value>)',
          500: 'rgb(var(--g-500) / <alpha-value>)',
          600: 'rgb(var(--g-600) / <alpha-value>)',
          700: 'rgb(var(--g-700) / <alpha-value>)',
          800: 'rgb(var(--g-800) / <alpha-value>)',
          900: 'rgb(var(--g-900) / <alpha-value>)',
          950: 'rgb(var(--g-950) / <alpha-value>)',
        },
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d4fb',
          300: '#9db3f7',
          400: '#6b8ff5',
          500: '#4f6ef0',
          600: '#3a55e0',
          700: '#2a3fc5',
          800: '#22317a',
          900: '#1a2680',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
