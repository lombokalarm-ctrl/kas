export interface SaleItem {
  id: number
  tanggal: string
  hari: string
  keterangan: string
  jumlah: number
  created_at: string
  updated_at: string
}

export interface SalesSummary {
  totalPenjualan: number
}

export interface SalesListResponse {
  items: SaleItem[]
  summary: SalesSummary
}

export interface CreateSaleRequest {
  tanggal: string
  keterangan: string
  jumlah: number
}
