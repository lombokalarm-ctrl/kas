import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

const authUserMock = vi.hoisted(() => ({
  current: {
    id: 1,
    username: 'owner',
    namaLengkap: 'Pemilik',
    role: 'owner',
  },
}))

vi.mock('../db.js', () => ({
  default: {
    query: queryMock,
  },
}))

vi.mock('../lib/auth.js', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    Object.assign(req, {
      user: authUserMock.current,
    })
    next()
  },
}))

import salesRoutes from './sales'

function toDateValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function getTodayValue() {
  return toDateValue(new Date())
}

function getCurrentMonthStartValue() {
  const now = new Date()
  return toDateValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

function getPreviousMonthValue() {
  const now = new Date()
  return toDateValue(new Date(now.getFullYear(), now.getMonth() - 1, 15))
}

describe('salesRoutes', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/sales', salesRoutes)

  beforeEach(() => {
    queryMock.mockReset()
    authUserMock.current = {
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    }
  })

  it('mengembalikan daftar penjualan dan ringkasan', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            tanggal: '2026-07-17',
            hari: 'Jumat',
            keterangan: 'Penjualan tunai',
            jumlah: 250000,
            created_at: '2026-07-17T00:00:00.000Z',
            updated_at: '2026-07-17T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            total_penjualan: 250000,
          },
        ],
      })

    const response = await request(app).get('/api/sales/transactions')

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.summary.totalPenjualan).toBe(250000)
  })

  it('menolak penjualan dengan data tidak lengkap', async () => {
    const response = await request(app).post('/api/sales').send({
      tanggal: '2026-07-17',
      jumlah: 12000,
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/belum lengkap/i)
  })

  it('mengizinkan staff melihat ringkasan penjualan untuk hari ini', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          total_penjualan: 12000,
        },
      ],
    })

    const response = await request(app).get('/api/sales/summary')

    expect(response.status).toBe(200)
    expect(response.body.totalPenjualan).toBe(12000)
  })

  it('mengizinkan staff melihat riwayat penjualan pada bulan berjalan', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            tanggal: getTodayValue(),
            hari: 'Selasa',
            keterangan: 'Penjualan tunai',
            jumlah: 12000,
            created_at: '2026-07-29T00:00:00.000Z',
            updated_at: '2026-07-29T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            total_penjualan: 12000,
          },
        ],
      })

    const response = await request(app)
      .get('/api/sales/transactions')
      .query({ startDate: getCurrentMonthStartValue(), endDate: getTodayValue() })

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.summary.totalPenjualan).toBe(12000)
  })

  it('menolak staff melihat riwayat penjualan di luar bulan berjalan', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    const response = await request(app)
      .get('/api/sales/transactions')
      .query({ startDate: getPreviousMonthValue(), endDate: getTodayValue() })

    expect(response.status).toBe(403)
    expect(response.body.message).toMatch(/bulan berjalan/i)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('menolak staff menyimpan penjualan dengan tanggal selain hari ini', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    const response = await request(app).post('/api/sales').send({
      tanggal: getPreviousMonthValue(),
      keterangan: 'Penjualan lama',
      jumlah: 12000,
    })

    expect(response.status).toBe(403)
    expect(response.body.message).toMatch(/hari ini/i)
    expect(queryMock).not.toHaveBeenCalled()
  })
})
