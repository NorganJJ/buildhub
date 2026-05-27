// OAuth flow для GitHub и Google
// Используем Authorization Code Flow вручную (без passport.js)

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:1420'
const API_URL = process.env.API_URL || 'http://localhost:3001'

// ─── GitHub ───────────────────────────────────────────────────────────────────

export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: `${API_URL}/api/auth/github/callback`,
    scope: 'user:email read:user',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function getGitHubToken(code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })
  const data = await res.json() as any
  if (data.error) throw new Error(data.error_description || data.error)
  return data.access_token
}

export async function getGitHubUser(accessToken: string) {
  const [userRes, emailsRes] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'BuildHub' },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'BuildHub' },
    }),
  ])
  const user = await userRes.json() as any
  const emails = await emailsRes.json() as any[]

  // Берём primary+verified email
  const primaryEmail = emails.find((e) => e.primary && e.verified)?.email
    || emails.find((e) => e.verified)?.email
    || user.email

  return {
    id: String(user.id),
    email: primaryEmail as string,
    name: user.name || user.login,
    username: user.login as string,
    avatarUrl: user.avatar_url as string | null,
  }
}

// ─── Google ───────────────────────────────────────────────────────────────────

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${API_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function getGoogleToken(code: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${API_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json() as any
  if (data.error) throw new Error(data.error_description || data.error)
  return data.access_token
}

export async function getGoogleUser(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const user = await res.json() as any
  return {
    id: String(user.id),
    email: user.email as string,
    name: user.name as string,
    avatarUrl: user.picture as string | null,
  }
}
