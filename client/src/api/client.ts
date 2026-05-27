import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../stores/authStore'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // отправляем httpOnly refresh-cookie на /auth/*
})

// Прикрепляем access-токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Авто-рефреш на 401 (refresh-токен берётся из httpOnly cookie)
let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any
    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    const { setAccessToken, logout } = useAuthStore.getState()
    try {
      // refresh-токен передаётся cookie автоматически (withCredentials)
      const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
      setAccessToken(data.accessToken)
      queue.forEach((cb) => cb(data.accessToken))
      queue = []
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      logout()
      queue = []
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)
