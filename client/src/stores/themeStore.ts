import { create } from 'zustand'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'buildhub-theme'

function applyTheme(theme: Theme) {
  const el = document.documentElement
  // Тёмная — дефолт (без атрибута); светлая — data-theme="light"
  if (theme === 'light') el.setAttribute('data-theme', 'light')
  else el.removeAttribute('data-theme')
}

function initialTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
    applyTheme(theme)
    set({ theme })
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))

// Применяем сохранённую тему сразу при загрузке модуля (на случай если inline-скрипт не сработал)
applyTheme(initialTheme())
