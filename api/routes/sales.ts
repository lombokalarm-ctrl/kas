import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import { requireAuth } from '../lib/auth.js'
import type {
  CreateSaleRequest,
  SalesListResponse,
  SalesSummary,
  SaleItem,
} from '../../shared/sales.js'

const router = Router()

router.use(requireAuth)

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

router.get('/transactions', async (req: Request, res: Response): Promise<void> => {
  const startDate =
    typeof req.query.startDate === 'string' ? req.query.startDate : undefined
  const endDate =
    typeof req.query.endDate === 'string' ? req.query.endDate : undefined
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

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateSaleRequest

  if (!body?.tanggal || !body?.keterangan || !body?.jumlah) {
    res.status(400).json({ message: 'Data penjualan belum lengkap.' })
    return
  }

  if (Number(body.jumlah) <= 0) {
    res.status(400).json({ message: 'Jumlah penjualan harus lebih besar dari nol.' })
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
