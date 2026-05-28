// Сервис отправки email через Resend API
// Документация: https://resend.com/docs

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'BuildHub <noreply@buildhub.app>'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:1420'
// Базовый URL API — на него ведёт ссылка подтверждения (бэкенд проверяет токен
// и редиректит на страницу SPA с ?success=1 / ?error=).
const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send')
    console.info(`[Email] Would send to ${to}: ${subject}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${API_URL}/api/auth/verify-email?token=${token}`
  await sendEmail(
    email,
    'Confirm your BuildHub account',
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;color:#fff">
        🚀 Welcome to BuildHub
      </h1>
      <p style="color:#a3a3a3;margin-bottom:24px">
        Confirm your email address to activate your account.
      </p>
      <a href="${url}"
        style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px">
        Confirm email
      </a>
      <p style="color:#525252;font-size:12px;margin-top:24px">
        Link expires in 24 hours. If you didn't sign up — ignore this email.
      </p>
    </div>
    `
  )
}

export async function sendWelcomeEmail(email: string, displayName: string) {
  await sendEmail(
    email,
    'Welcome to BuildHub! 🚀',
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;color:#fff">
        Hey ${displayName}! 👋
      </h1>
      <p style="color:#a3a3a3;margin-bottom:16px">
        Your account is now active. Start sharing your projects with the developer community.
      </p>
      <a href="${CLIENT_URL}"
        style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px">
        Go to BuildHub
      </a>
    </div>
    `
  )
}
