import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock, connectMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  connectMock: vi.fn(),
}))

vi.mock('../db.js', () => ({
  default: {
    query: queryMock,
    connect: connectMock,
  },
}))

import cashRoutes from './cash'

describe('cashRoutes', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/cash', cashRoutes)

  beforeEach(() => {
    queryMock.mockReset()
    connectMock.mockReset()
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
            jumlah_transaksi: 1,
          },
        ],
      })

    const response = await request(app).get('/api/cash/transactions')

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.summary.saldoTerakhir).toBe(1000000)
  })

  it('menolak transaksi dengan data tidak lengkap', async () => {
    const response = await request(app).post('/api/cash').send({
      tanggal: '2026-07-17',
      jumlah: 10000,
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/belum lengkap/i)
  })
})
