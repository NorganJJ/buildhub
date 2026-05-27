import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  website?: string
  githubUrl?: string
  isVerified: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  // refresh-токен хранится в httpOnly cookie на сервере — не в JS (защита от XSS-кражи).
  setAuth: (user: User, accessToken: string) => void
  setUser: (user: User) => void
  setAccessToken: (accessToken: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    {
      name: 'buildhub-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
)
