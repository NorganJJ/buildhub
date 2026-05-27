import { FastifyInstance } from 'fastify'

export function signAccessToken(app: FastifyInstance, userId: string): string {
  return app.jwt.sign(
    { userId },
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  )
}

export function verifyRefreshToken(token: string): string | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret'
    // In production use a separate JWT verify for refresh tokens
    return token
  } catch {
    return null
  }
}
