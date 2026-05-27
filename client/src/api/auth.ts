import { api } from './client'
import { useAuthStore } from '../stores/authStore'

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data as { user: any; accessToken: string; refreshToken: string }
}

export async function register(
  email: string,
  username: string,
  password: string,
  displayName?: string
) {
  const { data } = await api.post('/auth/register', { email, username, password, displayName })
  return data as { success: boolean; emailVerificationSent: boolean }
}

export async function resendVerification(email: string) {
  const { data } = await api.post('/auth/resend-verification', { email })
  return data as { success: boolean }
}

export async function logout() {
  const refreshToken = useAuthStore.getState().refreshToken
  try {
    await api.post('/auth/logout', { refreshToken })
  } catch {}
  useAuthStore.getState().logout()
}
