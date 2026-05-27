import { open as openWithShell } from '@tauri-apps/plugin-shell'

// В Tauri (десктоп) обычные <a target="_blank"> не открывают системный браузер —
// нужно вызвать shell.open(). В вебе используем обычный window.open.
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function openExternal(url: string) {
  if (!url) return
  if (isTauri) {
    try {
      await openWithShell(url)
      return
    } catch (err) {
      console.error('Failed to open external link via Tauri shell:', err)
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Хелпер для onClick на <a>: гасит дефолтную навигацию и открывает ссылку правильным способом.
export function handleExternalClick(url: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    openExternal(url)
  }
}
