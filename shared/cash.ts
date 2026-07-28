export type CashType = 'masuk' | 'keluar'

export interface CashTransaction {
  id: number
  tanggal: string
  hari: string
  keterangan: string
  jenis: CashType
  jumlah: number
  saldo: number
  catatan_edit: string | null
  edited_at: string | null
  edited_by_user_id: number | null
  edited_by_username: string | null
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

export interface UpdateCashTransactionRequest extends CreateCashTransactionRequest {
  catatanEdit: string
}

export interface CashFilters {
  startDate?: string
  endDate?: string
}
