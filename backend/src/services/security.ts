import { createHash, createHmac, timingSafeEqual } from 'crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

// ── Хэширование одноразовых токенов (verify/reset) для хранения в БД ──────────
// В БД храним SHA-256(token), пользователю в письме уходит сам token.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// ── Подписанные короткоживущие ссылки для скачивания ─────────────────────────
// Убирает JWT из URL: ссылка действует ~2 минуты и привязана к конкретному файлу.
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || process.env.JWT_ACCESS_SECRET || 'dev_secret_change'
const DOWNLOAD_TTL_MS = 2 * 60 * 1000

export function signDownload(fileId: string): { exp: number; sig: string } {
  const exp = Date.now() + DOWNLOAD_TTL_MS
  const sig = createHmac('sha256', DOWNLOAD_SECRET).update(`${fileId}.${exp}`).digest('hex')
  return { exp, sig }
}

export function verifyDownload(fileId: string, exp: number, sig: string): boolean {
  if (!exp || !sig || Number.isNaN(exp) || exp < Date.now()) return false
  const expected = createHmac('sha256', DOWNLOAD_SECRET).update(`${fileId}.${exp}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  return a.length === b.length && timingSafeEqual(a, b)
}

// ── Cookie с refresh-токеном (httpOnly) ──────────────────────────────────────
export const REFRESH_COOKIE = 'bh_rt'
export const OAUTH_STATE_COOKIE = 'bh_oauth_state'

const isProd = process.env.NODE_ENV === 'production'

// В проде клиент бывает на другом origin, чем API: web на своём домене и,
// главное, десктоп Tauri шлёт запросы с origin tauri://localhost (cross-site).
// Cross-site cookie доставляется только при SameSite=None + Secure (требует HTTPS).
// В dev (http://localhost) Secure ставить нельзя, поэтому остаёмся на Lax.
const baseCookie = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/auth',
}

export function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, { ...baseCookie, maxAge: 30 * 24 * 60 * 60 })
}
export function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { ...baseCookie })
}
export function getRefreshCookie(req: FastifyRequest): string | undefined {
  return (req as any).cookies?.[REFRESH_COOKIE]
}

export function setOAuthStateCookie(reply: FastifyReply, nonce: string) {
  reply.setCookie(OAUTH_STATE_COOKIE, nonce, { ...baseCookie, maxAge: 600 })
}
export function getOAuthStateCookie(req: FastifyRequest): string | undefined {
  return (req as any).cookies?.[OAUTH_STATE_COOKIE]
}
export function clearOAuthStateCookie(reply: FastifyReply) {
  reply.clearCookie(OAUTH_STATE_COOKIE, { ...baseCookie })
}

// ── Проверка силы секретов на старте (в продакшне) ───────────────────────────
export function assertSecrets() {
  if (process.env.NODE_ENV !== 'production') return
  const problems: string[] = []
  const a = process.env.JWT_ACCESS_SECRET || ''
  const r = process.env.JWT_REFRESH_SECRET || ''
  const weak = (s: string) => !s || s.length < 32 || /change|secret_here|dev_secret/i.test(s)
  if (weak(a)) problems.push('JWT_ACCESS_SECRET is missing or too weak (need 32+ random chars)')
  if (weak(r)) problems.push('JWT_REFRESH_SECRET is missing or too weak (need 32+ random chars)')
  if (a && r && a === r) problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ')
  if (problems.length) {
    throw new Error('Insecure configuration in production:\n - ' + problems.join('\n - '))
  }
}
