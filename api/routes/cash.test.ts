import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const { queryMock, connectMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  connectMock: vi.fn(),
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
    connect: connectMock,
  },
}))

vi.mock('../lib/auth.js', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    Object.assign(req, {
      user: authUserMock.current,
    })
    next()
  },
  requireRoles:
    () =>
    (_req: Request, _res: Response, next: NextFunction) => {
      next()
    },
}))

import cashRoutes from './cash'

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

describe('cashRoutes', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/cash', cashRoutes)

  beforeEach(() => {
    queryMock.mockReset()
    connectMock.mockReset()
    authUserMock.current = {
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    }
  })

  it('mengembalikan daftar transaksi dan ringkasan', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            tanggal: '2026-07-17',
            hari: 'Jumat',
            keterangan: 'Modal awal',
            jenis: 'masuk',
            jumlah: 1000000,
            saldo: 1000000,
            catatan_edit: null,
            edited_at: null,
            edited_by_user_id: null,
            edited_by_username: null,
            created_at: '2026-07-17T00:00:00.000Z',
            updated_at: '2026-07-17T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            saldo_terakhir: 1000000,
            total_masuk: 1000000,
            total_keluar: 0,
            total_penjualan: 0,
          },
        ],
      })

    const response = await request(app).get('/api/cash/transactions')

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.summary.saldoTerakhir).toBe(1000000)
    expect(response.body.summary.totalPenjualan).toBe(0)
  })

  it('menolak transaksi dengan data tidak lengkap', async () => {
    const response = await request(app).post('/api/cash').send({
      tanggal: '2026-07-17',
      jumlah: 10000,
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/belum lengkap/i)
  })

  it('mengembalikan ringkasan staff dengan saldo mengikuti filter aktif dan total harian', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          saldo_terakhir: 38000,
          total_masuk: 50000,
          total_keluar: 12000,
          total_penjualan: 27000,
        },
      ],
    })

    const response = await request(app).get('/api/cash/summary')

    expect(response.status).toBe(200)
    expect(response.body.saldoTerakhir).toBe(38000)
    expect(response.body.totalMasuk).toBe(50000)
    expect(response.body.totalKeluar).toBe(12000)
    expect(response.body.totalPenjualan).toBe(27000)
  })

  it('mengizinkan staff melihat saldo ringkasan untuk filter bulan berjalan', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          saldo_terakhir: 88000,
          total_masuk: 50000,
          total_keluar: 12000,
          total_penjualan: 27000,
        },
      ],
    })

    const response = await request(app)
      .get('/api/cash/summary')
      .query({ startDate: getCurrentMonthStartValue(), endDate: getTodayValue() })

    expect(response.status).toBe(200)
    expect(response.body.saldoTerakhir).toBe(88000)
    expect(response.body.totalMasuk).toBe(50000)
    expect(response.body.totalKeluar).toBe(12000)
    expect(response.body.totalPenjualan).toBe(27000)
  })

  it('menolak staff melihat ringkasan di luar bulan berjalan', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    const response = await request(app)
      .get('/api/cash/summary')
      .query({ startDate: getPreviousMonthValue(), endDate: getPreviousMonthValue() })

    expect(response.status).toBe(403)
    expect(response.body.message).toMatch(/bulan berjalan/i)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('menolak staff melihat riwayat transaksi di luar bulan berjalan', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    const response = await request(app)
      .get('/api/cash/transactions')
      .query({ startDate: getPreviousMonthValue(), endDate: getTodayValue() })

    expect(response.status).toBe(403)
    expect(response.body.message).toMatch(/bulan berjalan/i)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('menolak staff menyimpan transaksi dengan tanggal selain hari ini', async () => {
    authUserMock.current = {
      id: 2,
      username: 'staff',
      namaLengkap: 'Staff',
      role: 'staff',
    }

    const response = await request(app).post('/api/cash').send({
      tanggal: getPreviousMonthValue(),
      keterangan: 'Titip data lama',
      jenis: 'masuk',
      jumlah: 10000,
    })

    expect(response.status).toBe(403)
    expect(response.body.message).toMatch(/hari ini/i)
    expect(connectMock).not.toHaveBeenCalled()
  })
})
