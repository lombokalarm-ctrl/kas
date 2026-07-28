import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

vi.mock('../db.js', () => ({
  default: {
    query: queryMock,
  },
}))

import authRoutes from './auth'

describe('authRoutes', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)

  beforeEach(() => {
    queryMock.mockReset()
  })

  it('mengembalikan token saat login berhasil', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            username: 'owner',
            nama_lengkap: 'Pemilik',
            role: 'owner',
            password_hash: createHash('sha256').update('rahasia').digest('hex'),
            is_active: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1 })

    const response = await request(app).post('/api/auth/login').send({
      username: 'owner',
      password: 'rahasia',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.username).toBe('owner')
    expect(response.body.token).toBeTruthy()
  })
})
