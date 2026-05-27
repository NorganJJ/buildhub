const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Картинки хранятся как /uploads/... — добавляем базовый URL бэкенда
export function mediaUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}
