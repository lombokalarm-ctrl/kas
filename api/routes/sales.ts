import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import { requireAuth, type AuthenticatedRequest } from '../lib/auth.js'
import type {
  CreateSaleRequest,
  SalesListResponse,
  SalesSummary,
  SaleItem,
} from '../../shared/sales.js'

const router = Router()

router.use(requireAuth)

interface DateFilters {
  startDate?: string
  endDate?: string
}

function normalizeSummary(row?: Record<string, unknown>): SalesSummary {
  return {
    totalPenjualan: Number(row?.total_penjualan || 0),
  }
}

function buildWhereClause(startDate?: string, endDate?: string) {
  const values: string[] = []
  const clauses: string[] = []

  if (startDate) {
    values.push(startDate)
    clauses.push(`tanggal >= $${values.length}`)
  }

  if (endDate) {
    values.push(endDate)
    clauses.push(`tanggal <= $${values.length}`)
  }

  return {
    values,
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
  }
}

function formatDateValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function getCurrentMonthFilters() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: formatDateValue(monthStart),
    endDate: formatDateValue(monthEnd),
  }
}

function getRequestedFilters(req: Request, useCurrentMonthByDefault = false) {
  const requestFilters = {
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
  }

  if (requestFilters.startDate || requestFilters.endDate || !useCurrentMonthByDefault) {
    return requestFilters
  }

  return getCurrentMonthFilters()
}

function getTodayFilters() {
  const today = formatDateValue(new Date())

  return {
    startDate: today,
    endDate: today,
  }
}

function isWithinRange(value: string, startDate?: string, endDate?: string) {
  return (!startDate || value >= startDate) && (!endDate || value <= endDate)
}

function validateDateRange(filters: DateFilters) {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    return 'Rentang tanggal tidak valid.'
  }

  return null
}

function resolveStaffTransactionFilters(req: AuthenticatedRequest, res: Response) {
  const requestedFilters = getRequestedFilters(req)
  const rangeError = validateDateRange(requestedFilters)

  if (rangeError) {
    res.status(400).json({ message: rangeError })
    return null
  }

  if (req.user?.role !== 'staff') {
    return requestedFilters
  }

  if (!requestedFilters.startDate && !requestedFilters.endDate) {
    return getTodayFilters()
  }

  const currentMonthFilters = getCurrentMonthFilters()

  if (
    (requestedFilters.startDate &&
      !isWithinRange(
        requestedFilters.startDate,
        currentMonthFilters.startDate,
        currentMonthFilters.endDate,
      )) ||
    (requestedFilters.endDate &&
      !isWithinRange(
        requestedFilters.endDate,
        currentMonthFilters.startDate,
        currentMonthFilters.endDate,
      ))
  ) {
    res.status(403).json({
      message: 'Staff hanya boleh melihat riwayat penjualan pada bulan berjalan.',
    })
    return null
  }

  return requestedFilters
}

function isStaffLockedToToday(req: AuthenticatedRequest, tanggal: string) {
  if (req.user?.role !== 'staff') {
    return false
  }

  return tanggal !== getTodayFilters().startDate
}

router.get('/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const filters =
    req.user?.role === 'staff' ? getTodayFilters() : getRequestedFilters(req, true)
  const { startDate, endDate } = filters
  const { values, whereSql } = buildWhereClause(startDate, endDate)

  try {
    const result = await pool.query(
      `
        SELECT
          COALESCE(SUM(jumlah), 0) AS total_penjualan
        FROM penjualan
        ${whereSql}
      `,
      values,
    )

    res.status(200).json(normalizeSummary(result.rows[0]))
  } catch {
    res.status(500).json({ message: 'Gagal mengambil ringkasan penjualan.' })
  }
})

router.get('/transactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const staffAwareFilters = resolveStaffTransactionFilters(req, res)

  if (!staffAwareFilters) {
    return
  }

  const { startDate, endDate } = staffAwareFilters
  const { values, whereSql } = buildWhereClause(startDate, endDate)

  try {
    const itemsResult = await pool.query<SaleItem>(
      `
        SELECT
          id,
          TO_CHAR(tanggal, 'YYYY-MM-DD') AS tanggal,
          hari,
          keterangan,
          jumlah,
          created_at,
          updated_at
        FROM penjualan
        ${whereSql}
        ORDER BY tanggal DESC, id DESC
      `,
      values,
    )

    const summaryResult = await pool.query(
      `
        SELECT
          COALESCE(SUM(jumlah), 0) AS total_penjualan
        FROM penjualan
        ${whereSql}
      `,
      values,
    )

    const response: SalesListResponse = {
      items: itemsResult.rows,
      summary: normalizeSummary(summaryResult.rows[0]),
    }

    res.status(200).json(response)
  } catch {
    res.status(500).json({ message: 'Gagal mengambil data penjualan.' })
  }
})

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const body = req.body as CreateSaleRequest

  if (!body?.tanggal || !body?.keterangan || !body?.jumlah) {
    res.status(400).json({ message: 'Data penjualan belum lengkap.' })
    return
  }

  if (Number(body.jumlah) <= 0) {
    res.status(400).json({ message: 'Jumlah penjualan harus lebih besar dari nol.' })
    return
  }

  if (isStaffLockedToToday(req, body.tanggal)) {
    res.status(403).json({ message: 'Staff hanya boleh menyimpan penjualan dengan tanggal hari ini.' })
    return
  }

  try {
    const result = await pool.query<SaleItem>(
      `
        INSERT INTO penjualan (tanggal, keterangan, jumlah)
        VALUES ($1, $2, $3)
        RETURNING
          id,
          TO_CHAR(tanggal, 'YYYY-MM-DD') AS tanggal,
          hari,
          keterangan,
          jumlah,
          created_at,
          updated_at
      `,
      [body.tanggal, body.keterangan.trim(), Number(body.jumlah)],
    )

    res.status(201).json(result.rows[0])
  } catch {
    res.status(500).json({ message: 'Gagal menyimpan penjualan.' })
  }
})

export default router
