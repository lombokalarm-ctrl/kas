import { create } from 'zustand'
import type { AuthUser, LoginRequest, LoginResponse } from '../../shared/auth'
import {
  clearStoredAuthSession,
  getStoredToken,
  getStoredUser,
  storeAuthSession,
} from '@/lib/auth-storage'

interface AuthStore {
  token: string | null
  user: AuthUser | null
  isChecking: boolean
  isLoggingIn: boolean
  error: string | null
  initialize: () => Promise<void>
  login: (payload: LoginRequest) => Promise<boolean>
  logout: () => Promise<void>
}

function getAuthHeaders() {
  const token = getStoredToken()

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: getStoredToken(),
  user: getStoredUser(),
  isChecking: true,
  isLoggingIn: false,
  error: null,
  initialize: async () => {
    const token = getStoredToken()
    const storedUser = getStoredUser()

    if (!token || !storedUser) {
      clearStoredAuthSession()
      set({ token: null, user: null, isChecking: false, error: null })
      return
    }

    set({ isChecking: true, error: null })

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Sesi login tidak valid.')
      }

      const data = (await response.json()) as { user: AuthUser }
      storeAuthSession(token, data.user)

      set({
        token,
        user: data.user,
        isChecking: false,
        error: null,
      })
    } catch {
      clearStoredAuthSession()
      set({
        token: null,
        user: null,
        isChecking: false,
        error: null,
      })
    }
  },
  login: async (payload) => {
    set({ isLoggingIn: true, error: null })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as LoginResponse & { message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal.')
      }

      storeAuthSession(data.token, data.user)

      set({
        token: data.token,
        user: data.user,
        isChecking: false,
        isLoggingIn: false,
        error: null,
      })

      return true
    } catch (error) {
      clearStoredAuthSession()
      set({
        token: null,
        user: null,
        isChecking: false,
        isLoggingIn: false,
        error: error instanceof Error ? error.message : 'Login gagal.',
      })

      return false
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
      })
    } catch {
      // abaikan error logout jaringan, sesi lokal tetap dibersihkan
    }

    clearStoredAuthSession()
    set({
      token: null,
      user: null,
      isChecking: false,
      isLoggingIn: false,
      error: null,
    })
  },
}))
