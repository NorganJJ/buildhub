// Детерминированные градиенты для фоллбек-баннеров и аватаров (стиль мокапов BuildHub).

const PAIRS: [string, string][] = [
  ['#0ea5e9', '#3b82f6'],
  ['#10b981', '#0891b2'],
  ['#f59e0b', '#ef4444'],
  ['#84cc16', '#22c55e'],
  ['#a855f7', '#ec4899'],
  ['#eab308', '#f97316'],
  ['#06b6d4', '#6366f1'],
  ['#ec4899', '#f43f5e'],
  ['#4f6ef0', '#8b5cf6'],
  ['#f43f5e', '#8b5cf6'],
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Градиент 135° для баннера карточки/проекта
export function bannerGradient(seed: string): string {
  const [a, b] = PAIRS[hash(seed) % PAIRS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

// Градиент для аватара пользователя (по имени)
export function avatarGradient(seed: string): string {
  const [a, b] = PAIRS[hash(seed + '~') % PAIRS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}
