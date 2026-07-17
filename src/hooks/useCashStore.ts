import { create } from 'zustand'
import type {
  CashFilters,
  CashListResponse,
  CashSummary,
  CashTransaction,
  CreateCashTransactionRequest,
} from '../../shared/cash'

const defaultSummary: CashSummary = {
  saldoTerakhir: 0,
  totalMasuk: 0,
  totalKeluar: 0,
  jumlahTransaksi: 0,
}

interface CashStore {
  items: CashTransaction[]
  summary: CashSummary
  filters: CashFilters
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  setFilters: (filters: CashFilters) => void
  clearFeedback: () => void
  fetchTransactions: (filters?: CashFilters) => Promise<void>
  createTransaction: (payload: CreateCashTransactionRequest) => Promise<boolean>
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

export const useCashStore = create<CashStore>((set, get) => ({
  items: [],
  summary: defaultSummary,
  filters: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  successMessage: null,
  setFilters: (filters) => {
    set({ filters })
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
      const response = await fetch(`/api/cash/transactions${toQueryString(filters)}`)

      if (!response.ok) {
        throw new Error('Gagal memuat data kas.')
      }

      const data: CashListResponse = await response.json()

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
  createTransaction: async (payload) => {
    set({ isSubmitting: true, error: null, successMessage: null })

    try {
      const response = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json()) as { message?: string }
        throw new Error(data.message || 'Gagal menyimpan transaksi.')
      }

      await get().fetchTransactions(get().filters)

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
}))
