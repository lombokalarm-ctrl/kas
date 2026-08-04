import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import {
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
} from '../lib/auth.js'
import type {
  CashListResponse,
  CashSummary,
  CashTransaction,
  CreateCashTransactionRequest,
  UpdateCashTransactionRequest,
} from '../../shared/cash.js'

const router = Router()

router.use(requireAuth)

interface DateFilters {
  startDate?: string
  endDate?: string
}

function normalizeSummary(row?: Record<string, unknown>): CashSummary {
  return {
    saldoTerakhir: Number(row?.saldo_terakhir || 0),
    totalMasuk: Number(row?.total_masuk || 0),
    totalKeluar: Number(row?.total_keluar || 0),
    totalPenjualan: Number(row?.total_penjualan || 0),
  }
}

function buildWhereClause(startDate?: string, endDate?: string, parameterOffset = 0) {
  const values: string[] = []
  const clauses: string[] = []

  if (startDate) {
    values.push(startDate)
    clauses.push(`tanggal >= $${values.length + parameterOffset}`)
  }

  if (endDate) {
    values.push(endDate)
    clauses.push(`tanggal <= $${values.length + parameterOffset}`)
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

function resolveStaffSummaryFilters(req: AuthenticatedRequest, res: Response) {
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
    return requestedFilters
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
      message: 'Staff hanya boleh melihat ringkasan dan riwayat pada bulan berjalan.',
    })
    return null
  }

  return requestedFilters
}

function resolveTotalSummaryFilters(req: AuthenticatedRequest) {
  if (req.user?.role === 'staff') {
    return getTodayFilters()
  }

  return getRequestedFilters(req, true)
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
      message: 'Staff hanya boleh melihat riwayat transaksi pada bulan berjalan.',
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
  const saldoFilters = resolveStaffSummaryFilters(req, res)

  if (!saldoFilters) {
    return
  }

  const { startDate, endDate } = saldoFilters
  const { values, whereSql } = buildWhereClause(startDate, endDate)
  const totalFilters = resolveTotalSummaryFilters(req)
  const { values: totalValues, whereSql: totalWhereSql } = buildWhereClause(
    totalFilters.startDate,
    totalFilters.endDate,
    values.length,
  )

  try {
    const result =
      req.user?.role === 'staff'
        ? await (() => {
            const todayFilters = getTodayFilters()
            const { values: todayValues, whereSql: todayWhereSql } = buildWhereClause(
              todayFilters.startDate,
              todayFilters.endDate,
              values.length,
            )

            return pool.query(
              `
                WITH filtered_kas AS (
                  SELECT *
                  FROM kas_transaksi
                  ${whereSql}
                ),
                today_kas AS (
                  SELECT *
                  FROM kas_transaksi
                  ${todayWhereSql}
                ),
                today_penjualan AS (
                  SELECT *
                  FROM penjualan
                  ${todayWhereSql}
                )
                SELECT
                  COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                    - COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                    AS saldo_terakhir,
                  COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM today_kas), 0) AS total_masuk,
                  COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM today_kas), 0) AS total_keluar,
                  COALESCE((SELECT SUM(jumlah) FROM today_penjualan), 0) AS total_penjualan
              `,
              [...values, ...todayValues],
            )
          })()
        : await pool.query(
            `
              WITH filtered_kas AS (
                SELECT *
                FROM kas_transaksi
                ${whereSql}
              ),
              total_kas AS (
                SELECT *
                FROM kas_transaksi
                ${totalWhereSql}
              ),
              filtered_penjualan AS (
                SELECT *
                FROM penjualan
                ${totalWhereSql}
              )
              SELECT
                COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                  - COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                  AS saldo_terakhir,
                COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM total_kas), 0) AS total_masuk,
                COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM total_kas), 0) AS total_keluar,
                COALESCE((SELECT SUM(jumlah) FROM filtered_penjualan), 0) AS total_penjualan
            `,
            [...values, ...totalValues],
          )

    res.status(200).json(normalizeSummary(result.rows[0]))
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil ringkasan kas.' })
  }
})

router.get('/transactions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const staffAwareFilters = resolveStaffTransactionFilters(req, res)

  if (!staffAwareFilters) {
    return
  }

  const { startDate, endDate } = staffAwareFilters
  const { values, whereSql } = buildWhereClause(startDate, endDate)
  const totalFilters = resolveTotalSummaryFilters(req)
  const { values: totalValues, whereSql: totalWhereSql } = buildWhereClause(
    totalFilters.startDate,
    totalFilters.endDate,
    values.length,
  )

  try {
    const itemsResult = await pool.query<CashTransaction>(
      `
        SELECT
          kas_transaksi.id,
          TO_CHAR(kas_transaksi.tanggal, 'YYYY-MM-DD') AS tanggal,
          kas_transaksi.hari,
          kas_transaksi.keterangan,
          kas_transaksi.jenis,
          kas_transaksi.jumlah,
          kas_transaksi.saldo,
          kas_transaksi.catatan_edit,
          kas_transaksi.edited_at,
          kas_transaksi.edited_by_user_id,
          edited_by.username AS edited_by_username,
          kas_transaksi.created_at,
          kas_transaksi.updated_at
        FROM kas_transaksi
        LEFT JOIN users AS edited_by ON edited_by.id = kas_transaksi.edited_by_user_id
        ${whereSql}
        ORDER BY kas_transaksi.tanggal DESC, kas_transaksi.id DESC
      `,
      values,
    )

    const summaryResult =
      req.user?.role === 'staff'
        ? await (() => {
            const todayFilters = getTodayFilters()
            const { values: todayValues, whereSql: todayWhereSql } = buildWhereClause(
              todayFilters.startDate,
              todayFilters.endDate,
              values.length,
            )

            return pool.query(
              `
                WITH filtered_kas AS (
                  SELECT *
                  FROM kas_transaksi
                  ${whereSql}
                ),
                today_kas AS (
                  SELECT *
                  FROM kas_transaksi
                  ${todayWhereSql}
                ),
                today_penjualan AS (
                  SELECT *
                  FROM penjualan
                  ${todayWhereSql}
                )
                SELECT
                  COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                    - COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                    AS saldo_terakhir,
                  COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM today_kas), 0) AS total_masuk,
                  COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM today_kas), 0) AS total_keluar,
                  COALESCE((SELECT SUM(jumlah) FROM today_penjualan), 0) AS total_penjualan
              `,
              [...values, ...todayValues],
            )
          })()
        : await pool.query(
            `
              WITH filtered_kas AS (
                SELECT *
                FROM kas_transaksi
                ${whereSql}
              ),
              total_kas AS (
                SELECT *
                FROM kas_transaksi
                ${totalWhereSql}
              ),
              filtered_penjualan AS (
                SELECT *
                FROM penjualan
                ${totalWhereSql}
              )
              SELECT
                COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                  - COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM filtered_kas), 0)
                  AS saldo_terakhir,
                COALESCE((SELECT SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) FROM total_kas), 0) AS total_masuk,
                COALESCE((SELECT SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) FROM total_kas), 0) AS total_keluar,
                COALESCE((SELECT SUM(jumlah) FROM filtered_penjualan), 0) AS total_penjualan
            `,
            [...values, ...totalValues],
          )

    const response: CashListResponse = {
      items: itemsResult.rows,
      summary: normalizeSummary(summaryResult.rows[0]),
    }

    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil transaksi kas.' })
  }
})

router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const body = req.body as CreateCashTransactionRequest

  if (!body?.tanggal || !body?.keterangan || !body?.jenis || !body?.jumlah) {
    res.status(400).json({ message: 'Data transaksi belum lengkap.' })
    return
  }

  if (!['masuk', 'keluar'].includes(body.jenis)) {
    res.status(400).json({ message: 'Jenis transaksi tidak valid.' })
    return
  }

  if (Number(body.jumlah) <= 0) {
    res.status(400).json({ message: 'Jumlah harus lebih besar dari nol.' })
    return
  }

  if (isStaffLockedToToday(req, body.tanggal)) {
    res.status(403).json({ message: 'Staff hanya boleh menyimpan transaksi dengan tanggal hari ini.' })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const insertResult = await client.query<{ id: number }>(
      `
        INSERT INTO kas_transaksi (tanggal, keterangan, jenis, jumlah)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [body.tanggal, body.keterangan.trim(), body.jenis, Number(body.jumlah)],
    )

    const insertedId = insertResult.rows[0].id

    const rowResult = await client.query<CashTransaction>(
      `
        SELECT
          kas_transaksi.id,
          TO_CHAR(kas_transaksi.tanggal, 'YYYY-MM-DD') AS tanggal,
          kas_transaksi.hari,
          kas_transaksi.keterangan,
          kas_transaksi.jenis,
          kas_transaksi.jumlah,
          kas_transaksi.saldo,
          kas_transaksi.catatan_edit,
          kas_transaksi.edited_at,
          kas_transaksi.edited_by_user_id,
          edited_by.username AS edited_by_username,
          kas_transaksi.created_at,
          kas_transaksi.updated_at
        FROM kas_transaksi
        LEFT JOIN users AS edited_by ON edited_by.id = kas_transaksi.edited_by_user_id
        WHERE kas_transaksi.id = $1
      `,
      [insertedId],
    )

    await client.query('COMMIT')

    res.status(201).json(rowResult.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: 'Gagal menyimpan transaksi kas.' })
  } finally {
    client.release()
  }
})

router.put(
  '/:id',
  requireRoles(['owner']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const transactionId = Number(req.params.id)
    const body = req.body as UpdateCashTransactionRequest

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      res.status(400).json({ message: 'ID transaksi tidak valid.' })
      return
    }

    if (!body?.tanggal || !body?.keterangan || !body?.jenis || !body?.jumlah) {
      res.status(400).json({ message: 'Data transaksi belum lengkap.' })
      return
    }

    if (!['masuk', 'keluar'].includes(body.jenis)) {
      res.status(400).json({ message: 'Jenis transaksi tidak valid.' })
      return
    }

    if (Number(body.jumlah) <= 0) {
      res.status(400).json({ message: 'Jumlah harus lebih besar dari nol.' })
      return
    }

    if (!body.catatanEdit?.trim()) {
      res.status(400).json({ message: 'Catatan edit wajib diisi saat mengubah transaksi.' })
      return
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const updateResult = await client.query<{ id: number }>(
        `
          UPDATE kas_transaksi
          SET
            tanggal = $1,
            keterangan = $2,
            jenis = $3,
            jumlah = $4,
            catatan_edit = $5,
            edited_at = NOW(),
            edited_by_user_id = $6
          WHERE id = $7
          RETURNING id
        `,
        [
          body.tanggal,
          body.keterangan.trim(),
          body.jenis,
          Number(body.jumlah),
          body.catatanEdit.trim(),
          req.user?.id,
          transactionId,
        ],
      )

      if (!updateResult.rowCount) {
        await client.query('ROLLBACK')
        res.status(404).json({ message: 'Transaksi tidak ditemukan.' })
        return
      }

      const rowResult = await client.query<CashTransaction>(
        `
          SELECT
            kas_transaksi.id,
            TO_CHAR(kas_transaksi.tanggal, 'YYYY-MM-DD') AS tanggal,
            kas_transaksi.hari,
            kas_transaksi.keterangan,
            kas_transaksi.jenis,
            kas_transaksi.jumlah,
            kas_transaksi.saldo,
            kas_transaksi.catatan_edit,
            kas_transaksi.edited_at,
            kas_transaksi.edited_by_user_id,
            edited_by.username AS edited_by_username,
            kas_transaksi.created_at,
            kas_transaksi.updated_at
          FROM kas_transaksi
          LEFT JOIN users AS edited_by ON edited_by.id = kas_transaksi.edited_by_user_id
          WHERE kas_transaksi.id = $1
        `,
        [transactionId],
      )

      await client.query('COMMIT')

      res.status(200).json(rowResult.rows[0])
    } catch {
      await client.query('ROLLBACK')
      res.status(500).json({ message: 'Gagal memperbarui transaksi kas.' })
    } finally {
      client.release()
    }
  },
)

export default router
