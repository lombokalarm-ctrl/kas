import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

vi.mock('../db.js', () => ({
  default: {
    query: queryMock,
  },
}))

vi.mock('../lib/auth.js', () => ({
  requireAuth: (_req: Request, _res: Response, next: NextFunction) => {
    next()
  },
}))

import salesRoutes from './sales'

describe('salesRoutes', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/sales', salesRoutes)

  beforeEach(() => {
    queryMock.mockReset()
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
})
