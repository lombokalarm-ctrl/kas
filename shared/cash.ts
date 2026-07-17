export type CashType = 'masuk' | 'keluar'

export interface CashTransaction {
  id: number
  tanggal: string
  hari: string
  keterangan: string
  jenis: CashType
  jumlah: number
  saldo: number
  created_at: string
  updated_at: string
}

export interface CashSummary {
  saldoTerakhir: number
  totalMasuk: number
  totalKeluar: number
  jumlahTransaksi: number
}

export interface CashListResponse {
  items: CashTransaction[]
  summary: CashSummary
}

export interface CreateCashTransactionRequest {
  tanggal: string
  keterangan: string
  jenis: CashType
  jumlah: number
}

export interface CashFilters {
  startDate?: string
  endDate?: string
}
