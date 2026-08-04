import { create } from 'zustand'
import type {
  CashFilters,
  CashSummary,
  CashTransaction,
  CreateCashTransactionRequest,
  UpdateCashTransactionRequest,
} from '../../shared/cash'
import { getStoredToken } from '@/lib/auth-storage'
import { getCurrentMonthFilters, getTodayFilters } from '@/utils/format'

const defaultSummary: CashSummary = {
  saldoTerakhir: 0,
  totalMasuk: 0,
  totalKeluar: 0,
  totalPenjualan: 0,
}

interface CashStore {
  items: CashTransaction[]
  summary: CashSummary
  filters: CashFilters
  summaryFilters: CashFilters
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  setFilters: (filters: CashFilters) => void
  setSummaryFilters: (filters: CashFilters) => void
  clearFeedback: () => void
  fetchTransactions: (filters?: CashFilters) => Promise<void>
  fetchSummary: (filters?: CashFilters) => Promise<void>
  createTransaction: (payload: CreateCashTransactionRequest) => Promise<boolean>
  updateTransaction: (
    id: number,
    payload: UpdateCashTransactionRequest,
  ) => Promise<{ ok: boolean; message?: string }>
}

function toQueryString(filters: CashFilters) {
  const params = new URLSearchParams()

  if (filters.startDate) {
    params.set('startDate', filters.startDate)
  }

  if (filters.endDate) {
    params.set('endDate', filters.endDate)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

function getAuthHeaders() {
  const token = getStoredToken()

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export const useCashStore = create<CashStore>((set, get) => ({
  items: [],
  summary: defaultSummary,
  filters: getTodayFilters(),
  summaryFilters: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
  setFilters: (filters) => {
    set({ filters })
  },
  setSummaryFilters: (filters) => {
    set({ summaryFilters: filters })
  },
  clearFeedback: () => {
    set({ error: null, successMessage: null })
  },
  fetchTransactions: async (nextFilters) => {
    const filters = nextFilters ?? get().filters

    set({
      isLoading: true,
      error: null,
      filters,
    })

    try {
      const response = await fetch(`/api/cash/transactions${toQueryString(filters)}`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal memuat data kas.')
      }

      const data = (await response.json()) as { items: CashTransaction[] }

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
  fetchSummary: async (nextFilters) => {
    const summaryFilters = nextFilters ?? get().summaryFilters

    set({
      error: null,
      summaryFilters,
    })

    try {
      const response = await fetch(`/api/cash/summary${toQueryString(summaryFilters)}`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Gagal memuat ringkasan kas.')
      }

      const data = (await response.json()) as CashSummary

      set({
        summary: data,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })
    }
  },
  createTransaction: async (payload) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string }
        throw new Error(data.message || 'Gagal menyimpan transaksi.')
      }

      await get().fetchTransactions(get().filters)
      await get().fetchSummary(get().summaryFilters)

      set({
        isSubmitting: false,
        successMessage: 'Transaksi berhasil disimpan.',
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
  updateTransaction: async (id, payload) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch(`/api/cash/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui transaksi.')
      }

      await get().fetchTransactions(get().filters)
      await get().fetchSummary(get().summaryFilters)

      set({
        isSubmitting: false,
        successMessage: 'Transaksi berhasil diperbarui.',
      })

      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan.'

      set({
        isSubmitting: false,
        error: message,
      })

      return { ok: false, message }
    }
  },
}))
