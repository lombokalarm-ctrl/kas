import { create } from 'zustand'
import type { CreateUserRequest, ManagedUser, UpdateManagedUserRequest } from '../../shared/auth'
import { getStoredToken } from '@/lib/auth-storage'

interface UserManagementStore {
  items: ManagedUser[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  fetchUsers: () => Promise<void>
  createUser: (payload: CreateUserRequest) => Promise<boolean>
  updateUser: (userId: number, payload: UpdateManagedUserRequest) => Promise<boolean>
  deleteUser: (userId: number) => Promise<boolean>
  clearFeedback: () => void
}

function getAuthHeaders() {
  const token = getStoredToken()

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export const useUserManagementStore = create<UserManagementStore>((set, get) => ({
  items: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
  fetchUsers: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/auth/users', {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string }
        throw new Error(data.message || 'Gagal memuat daftar user.')
      }

      const data = (await response.json()) as { items: ManagedUser[] }
      set({
        items: data.items,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })
    }
  },
  createUser: async (payload) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambah user.')
      }

      await get().fetchUsers()

      set({
        isSubmitting: false,
        successMessage: 'User berhasil ditambahkan.',
      })

      return true
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })

      return false
    }
  },
  updateUser: async (userId, payload) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui user.')
      }

      await get().fetchUsers()

      set({
        isSubmitting: false,
        successMessage: 'User berhasil diperbarui.',
      })

      return true
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })

      return false
    }
  },
  deleteUser: async (userId) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string }
        throw new Error(data.message || 'Gagal menghapus user.')
      }

      await get().fetchUsers()

      set({
        isSubmitting: false,
        successMessage: 'User berhasil dihapus.',
      })

      return true
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })

      return false
    }
  },
  clearFeedback: () => set({ error: null, successMessage: null }),
}))
