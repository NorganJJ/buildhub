import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomUUID, randomBytes } from 'crypto'
import { prisma } from '../config/prisma'
import { signAccessToken } from '../services/tokenService'
import { authenticate } from '../middleware/authenticate'
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService'
import {
  getGitHubAuthUrl, getGitHubToken, getGitHubUser,
  getGoogleAuthUrl, getGoogleToken, getGoogleUser,
} from '../services/oauthService'

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:1420'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Генерация безопасного токена
function makeToken() {
  return randomBytes(32).toString('hex')
}

// Генерация уникального username из базового (например "john_doe_3")
async function uniqueUsername(base: string): Promise<string> {
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 25)
  let username = clean
  let i = 1
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${clean}_${i++}`
  }
  return username
}

export async function authRoutes(app: FastifyInstance) {

  // ── Email/Password Register ────────────────────────────────────────────────
  app.post('/register', async (req, reply) => {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Validation failed', details: body.error.flatten() })
    const { email, username, password, displayName } = body.data

    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (exists) {
      const field = exists.email === email ? 'email' : 'username'
      return reply.status(409).send({ error: `This ${field} is already taken` })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const emailVerifyToken = makeToken()
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    const user = await prisma.user.create({
      data: {
        email, username, passwordHash,
        displayName: displayName || username,
        emailVerifyToken, emailVerifyExpires,
        isVerified: false,
      },
    })

    // Отправляем письмо подтверждения (не блокируем ответ если упадёт)
    sendVerificationEmail(email, emailVerifyToken).catch((err) =>
      console.error('[Email] Failed to send verification:', err)
    )

    // НЕ авторизуем пользователя сразу — сначала он должен подтвердить email.
    void user
    return reply.status(201).send({
      success: true,
      emailVerificationSent: true,
    })
  })

  // ── Email/Password Login ───────────────────────────────────────────────────
  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Validation failed' })
    const { email, password } = body.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) return reply.status(401).send({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    // Требуем подтверждённый email перед входом
    if (!user.isVerified) {
      return reply.status(403).send({
        error: 'Please verify your email before signing in',
        code: 'EMAIL_NOT_VERIFIED',
      })
    }

    const accessToken = signAccessToken(app, user.id)
    const refreshToken = await createRefreshToken(user.id)
    return reply.send({ user: sanitizeUser(user), accessToken, refreshToken })
  })

  // ── Verify email ──────────────────────────────────────────────────────────
  app.get('/verify-email', async (req, reply) => {
    const { token } = req.query as { token?: string }
    if (!token) return reply.status(400).send({ error: 'Token required' })

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, emailVerifyExpires: { gt: new Date() } },
    })
    if (!user) {
      return reply.redirect(`${CLIENT_URL}/verify-email?error=invalid`)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    })

    // Отправляем приветственное письмо
    sendWelcomeEmail(user.email, user.displayName || user.username).catch(() => {})

    return reply.redirect(`${CLIENT_URL}/verify-email?success=1`)
  })

  // ── Resend verification email ─────────────────────────────────────────────
  // Публичный: принимает email. Всегда отвечает успехом (анти-энумерация).
  app.post('/resend-verification', async (req, reply) => {
    const { email } = (req.body ?? {}) as { email?: string }
    if (!email) return reply.status(400).send({ error: 'Email required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (user && !user.isVerified) {
      const emailVerifyToken = makeToken()
      const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken, emailVerifyExpires } })
      await sendVerificationEmail(user.email, emailVerifyToken).catch((err) =>
        console.error('[Email] Failed to resend verification:', err)
      )
    }
    return reply.send({ success: true })
  })

  // ── Forgot password ───────────────────────────────────────────────────────
  app.post('/forgot-password', async (req, reply) => {
    const { email } = req.body as { email?: string }
    if (!email) return reply.status(400).send({ error: 'Email required' })

    const user = await prisma.user.findUnique({ where: { email } })
    // Всегда отвечаем успехом — не раскрываем существование аккаунта
    if (!user || !user.passwordHash) {
      return reply.send({ success: true })
    }

    const resetToken = makeToken()
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000) // 1 час

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    })

    const url = `${CLIENT_URL}/reset-password?token=${resetToken}`
    const { sendEmail } = await import('../services/emailService')
    await sendEmail(
      email,
      'Reset your BuildHub password',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;color:#fff">Reset password</h1>
        <p style="color:#a3a3a3;margin-bottom:24px">
          We received a request to reset the password for your BuildHub account.<br/>
          Click the button below to choose a new password.
        </p>
        <a href="${url}"
          style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px">
          Reset password
        </a>
        <p style="color:#525252;font-size:12px;margin-top:24px">
          Link expires in 1 hour. If you didn't request this — ignore this email, your password won't change.
        </p>
      </div>
      `
    ).catch((err: any) => console.error('[Email] Failed to send reset email:', err))

    return reply.send({ success: true })
  })

  // ── Reset password ────────────────────────────────────────────────────────
  app.post('/reset-password', async (req, reply) => {
    const { token, password } = req.body as { token?: string; password?: string }
    if (!token || !password) return reply.status(400).send({ error: 'Token and password required' })
    if (password.length < 8) return reply.status(400).send({ error: 'Password must be at least 8 characters' })

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    })
    if (!user) return reply.status(400).send({ error: 'Invalid or expired reset link' })

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null },
    })

    return reply.send({ success: true })
  })
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) return reply.status(400).send({ error: 'Refresh token required' })
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) return reply.status(401).send({ error: 'Invalid or expired refresh token' })
    const user = await prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user) return reply.status(401).send({ error: 'User not found' })
    await prisma.refreshToken.delete({ where: { token: refreshToken } })
    const newRefreshToken = await createRefreshToken(user.id)
    const accessToken = signAccessToken(app, user.id)
    return reply.send({ accessToken, refreshToken: newRefreshToken })
  })

  // ── Logout ────────────────────────────────────────────────────────────────
  app.post('/logout', { preHandler: authenticate }, async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    return reply.send({ success: true })
  })

  // ── Me ────────────────────────────────────────────────────────────────────
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const user = await prisma.user.findUnique({ where: { id: (req as any).userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send({ user: sanitizeUser(user) })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // OAUTH — GitHub
  // ─────────────────────────────────────────────────────────────────────────

  // GET /api/auth/github — редирект на GitHub
  app.get('/github', async (req, reply) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return reply.status(503).send({ error: 'GitHub OAuth not configured' })
    }
    const state = randomBytes(16).toString('hex')
    const url = getGitHubAuthUrl(state)
    return reply.redirect(url)
  })

  // GET /api/auth/github/callback — GitHub редиректит сюда
  app.get('/github/callback', async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string }
    if (error || !code) {
      return reply.redirect(`${CLIENT_URL}/login?error=oauth_cancelled`)
    }
    try {
      const accessToken = await getGitHubToken(code)
      const profile = await getGitHubUser(accessToken)
      const { user, isNew } = await findOrCreateOAuthUser('github', profile)
      const jwtToken = signAccessToken(app, user.id)
      const refreshToken = await createRefreshToken(user.id)
      // Передаём токены клиенту через URL (Tauri перехватит редирект)
      return reply.redirect(
        `${CLIENT_URL}/oauth/callback?accessToken=${jwtToken}&refreshToken=${refreshToken}&isNew=${isNew}`
      )
    } catch (err: any) {
      console.error('[GitHub OAuth]', err)
      return reply.redirect(`${CLIENT_URL}/login?error=oauth_failed`)
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // OAUTH — Google
  // ─────────────────────────────────────────────────────────────────────────

  // GET /api/auth/google — редирект на Google
  app.get('/google', async (req, reply) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return reply.status(503).send({ error: 'Google OAuth not configured' })
    }
    const state = randomBytes(16).toString('hex')
    const url = getGoogleAuthUrl(state)
    return reply.redirect(url)
  })

  // GET /api/auth/google/callback — Google редиректит сюда
  app.get('/google/callback', async (req, reply) => {
    const { code, error } = req.query as { code?: string; error?: string }
    if (error || !code) {
      return reply.redirect(`${CLIENT_URL}/login?error=oauth_cancelled`)
    }
    try {
      const accessToken = await getGoogleToken(code)
      const profile = await getGoogleUser(accessToken)
      const { user, isNew } = await findOrCreateOAuthUser('google', {
        ...profile,
        username: profile.email.split('@')[0],
      })
      const jwtToken = signAccessToken(app, user.id)
      const refreshToken = await createRefreshToken(user.id)
      return reply.redirect(
        `${CLIENT_URL}/oauth/callback?accessToken=${jwtToken}&refreshToken=${refreshToken}&isNew=${isNew}`
      )
    } catch (err: any) {
      console.error('[Google OAuth]', err)
      return reply.redirect(`${CLIENT_URL}/login?error=oauth_failed`)
    }
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateOAuthUser(
  provider: string,
  profile: { id: string; email: string; name: string; username?: string; avatarUrl?: string | null }
): Promise<{ user: any; isNew: boolean }> {

  // 1. Уже есть OAuth аккаунт — просто возвращаем юзера
  const existing = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.id } },
    include: { user: true },
  })
  if (existing) return { user: existing.user, isNew: false }

  // 2. Есть юзер с таким email — привязываем OAuth к нему
  const userByEmail = await prisma.user.findUnique({ where: { email: profile.email } })
  if (userByEmail) {
    await prisma.oAuthAccount.create({
      data: { userId: userByEmail.id, provider, providerAccountId: profile.id },
    })
    // Обновляем аватар если ещё не задан
    if (!userByEmail.avatarUrl && profile.avatarUrl) {
      await prisma.user.update({
        where: { id: userByEmail.id },
        data: { avatarUrl: profile.avatarUrl },
      })
    }
    const updated = await prisma.user.findUnique({ where: { id: userByEmail.id } })
    return { user: updated, isNew: false }
  }

  // 3. Новый пользователь
  const username = await uniqueUsername(profile.username || profile.email.split('@')[0])
  const user = await prisma.user.create({
    data: {
      email: profile.email,
      username,
      displayName: profile.name || username,
      avatarUrl: profile.avatarUrl || null,
      isVerified: true, // OAuth пользователи уже подтверждены провайдером
      passwordHash: null,
      oauthAccounts: {
        create: { provider, providerAccountId: profile.id },
      },
    },
  })
  return { user, isNew: true }
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = randomUUID() + '-' + randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  return token
}

function sanitizeUser(user: any) {
  const { passwordHash, emailVerifyToken, emailVerifyExpires, resetToken, resetTokenExp, ...safe } = user
  return safe
}
