import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { signAuthToken } from '../lib/auth'

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

  it('mengembalikan daftar user untuk owner', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          username: 'owner',
          nama_lengkap: 'Pemilik',
          role: 'owner',
          is_active: true,
          last_login_at: null,
          created_at: '2026-07-28T10:00:00+00',
        },
      ],
    })

    const token = signAuthToken({
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    })

    const response = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].username).toBe('owner')
  })

  it('menambah user baru untuk owner', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          username: 'staff1',
          nama_lengkap: 'Staff Kas',
          role: 'staff',
          is_active: true,
          last_login_at: null,
          created_at: '2026-07-28T10:00:00+00',
        },
      ],
    })

    const token = signAuthToken({
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    })

    const response = await request(app)
      .post('/api/auth/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'staff1',
        password: 'rahasia1',
        namaLengkap: 'Staff Kas',
        role: 'staff',
      })

    expect(response.status).toBe(201)
    expect(response.body.username).toBe('staff1')
    expect(response.body.role).toBe('staff')
  })

  it('memperbarui nama user dan password oleh owner', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 2 }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            username: 'staff1',
            nama_lengkap: 'Staff Baru',
            role: 'staff',
            is_active: true,
            last_login_at: null,
            created_at: '2026-07-28T10:00:00+00',
          },
        ],
      })

    const token = signAuthToken({
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    })

    const response = await request(app)
      .put('/api/auth/users/2')
      .set('Authorization', `Bearer ${token}`)
      .send({
        namaLengkap: 'Staff Baru',
        password: 'rahasia2',
      })

    expect(response.status).toBe(200)
    expect(response.body.username).toBe('staff1')
    expect(response.body.namaLengkap).toBe('Staff Baru')
  })

  it('menghapus user oleh owner', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 2 }],
      rowCount: 1,
    })

    const token = signAuthToken({
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    })

    const response = await request(app)
      .delete('/api/auth/users/2')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(204)
  })

  it('menolak owner menghapus akunnya sendiri', async () => {
    const token = signAuthToken({
      id: 1,
      username: 'owner',
      namaLengkap: 'Pemilik',
      role: 'owner',
    })

    const response = await request(app)
      .delete('/api/auth/users/1')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('sedang dipakai')
  })
})
