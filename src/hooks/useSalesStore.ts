import { create } from 'zustand'
import type { CashFilters } from '../../shared/cash'
import type {
  CreateSaleRequest,
  SalesListResponse,
  SalesSummary,
  SaleItem,
} from '../../shared/sales'
import { getStoredToken } from '@/lib/auth-storage'
import { getCurrentMonthFilters, getTodayFilters } from '@/utils/format'

const defaultSummary: SalesSummary = {
  totalPenjualan: 0,
}

interface SalesStore {
  items: SaleItem[]
  summary: SalesSummary
  filters: CashFilters
  summaryFilters: CashFilters
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  setFilters: (filters: CashFilters) => void
  setSummaryFilters: (filters: CashFilters) => void
  clearFeedback: () => void
  fetchSales: (filters?: CashFilters) => Promise<void>
  fetchSalesSummary: (filters?: CashFilters) => Promise<void>
  createSale: (payload: CreateSaleRequest) => Promise<boolean>
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

export const useSalesStore = create<SalesStore>((set, get) => ({
  items: [],
  summary: defaultSummary,
  filters: getTodayFilters(),
  summaryFilters: getCurrentMonthFilters(),
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
  fetchSales: async (nextFilters) => {
    const filters = nextFilters ?? get().filters

    set({
      isLoading: true,
      error: null,
      filters,
    })

    try {
      const response = await fetch(`/api/sales/transactions${toQueryString(filters)}`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      const data = (await response.json()) as SalesListResponse & { message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat data penjualan.')
      }

      set({
        items: data.items,
        summary: data.summary,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })
    }
  },
  fetchSalesSummary: async (nextFilters) => {
    const summaryFilters = nextFilters ?? get().summaryFilters

    set({
      error: null,
      summaryFilters,
    })

    try {
      const response = await fetch(`/api/sales/summary${toQueryString(summaryFilters)}`, {
        headers: {
          ...getAuthHeaders(),
        },
      })

      const data = (await response.json()) as SalesSummary & { message?: string }

      if (!response.ok) {
        throw new Error(data.message || 'Gagal memuat ringkasan penjualan.')
      }

      set({
        summary: data,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Terjadi kesalahan.',
      })
    }
  },
  createSale: async (payload) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string }
        throw new Error(data.message || 'Gagal menyimpan penjualan.')
      }

      await get().fetchSales(get().filters)
      await get().fetchSalesSummary(get().summaryFilters)

      set({
        isSubmitting: false,
        successMessage: 'Penjualan berhasil disimpan.',
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
}))
