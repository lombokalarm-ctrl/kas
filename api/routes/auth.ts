import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import {
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
  hashPassword,
  signAuthToken,
} from '../lib/auth.js'
import type {
  AuthUser,
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  ManagedUser,
  UserRole,
} from '../../shared/auth.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as LoginRequest

  if (!body?.username?.trim() || !body?.password) {
    res.status(400).json({ message: 'Username dan password wajib diisi.' })
    return
  }

  try {
    const result = await pool.query<{
      id: number
      username: string
      nama_lengkap: string | null
      role: UserRole
      password_hash: string
      is_active: boolean
    }>(
      `
        SELECT id, username, nama_lengkap, role, password_hash, is_active
        FROM users
        WHERE LOWER(username) = LOWER($1)
        LIMIT 1
      `,
      [body.username.trim()],
    )

    const account = result.rows[0]

    if (!account || !account.is_active) {
      res.status(401).json({ message: 'Username atau password salah.' })
      return
    }

    if (hashPassword(body.password) !== account.password_hash.toLowerCase()) {
      res.status(401).json({ message: 'Username atau password salah.' })
      return
    }

    const user: AuthUser = {
      id: account.id,
      username: account.username,
      namaLengkap: account.nama_lengkap,
      role: account.role,
    }

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [account.id])

    const response: LoginResponse = {
      token: signAuthToken(user),
      user,
    }

    res.status(200).json(response)
  } catch {
    res.status(500).json({ message: 'Gagal memproses login.' })
  }
})

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(200).json({ user: req.user })
})

router.get(
  '/users',
  requireAuth,
  requireRoles(['owner']),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await pool.query<{
        id: number
        username: string
        nama_lengkap: string | null
        role: UserRole
        is_active: boolean
        last_login_at: string | null
        created_at: string
      }>(`
        SELECT
          id,
          username,
          nama_lengkap,
          role,
          is_active,
          TO_CHAR(last_login_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS last_login_at,
          TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
        FROM users
        ORDER BY role DESC, username ASC
      `)

      const items: ManagedUser[] = result.rows.map((row) => ({
        id: row.id,
        username: row.username,
        namaLengkap: row.nama_lengkap,
        role: row.role,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
      }))

      res.status(200).json({ items })
    } catch {
      res.status(500).json({ message: 'Gagal memuat daftar user.' })
    }
  },
)

router.post(
  '/users',
  requireAuth,
  requireRoles(['owner']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const body = req.body as CreateUserRequest

    if (!body?.username?.trim() || !body?.password || !body?.role) {
      res.status(400).json({ message: 'Username, password, dan role wajib diisi.' })
      return
    }

    if (!['staff', 'admin', 'owner'].includes(body.role)) {
      res.status(400).json({ message: 'Role user tidak valid.' })
      return
    }

    if (body.password.length < 6) {
      res.status(400).json({ message: 'Password minimal 6 karakter.' })
      return
    }

    try {
      const result = await pool.query<{
        id: number
        username: string
        nama_lengkap: string | null
        role: UserRole
        is_active: boolean
        last_login_at: string | null
        created_at: string
      }>(
        `
          INSERT INTO users (username, password_hash, nama_lengkap, role, is_active)
          VALUES ($1, $2, $3, $4, TRUE)
          RETURNING
            id,
            username,
            nama_lengkap,
            role,
            is_active,
            TO_CHAR(last_login_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS last_login_at,
            TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
        `,
        [
          body.username.trim(),
          hashPassword(body.password),
          body.namaLengkap?.trim() || null,
          body.role,
        ],
      )

      const row = result.rows[0]
      const item: ManagedUser = {
        id: row.id,
        username: row.username,
        namaLengkap: row.nama_lengkap,
        role: row.role,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
      }

      res.status(201).json(item)
    } catch (error) {
      const isDuplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'

      if (isDuplicate) {
        res.status(409).json({ message: 'Username sudah dipakai.' })
        return
      }

      res.status(500).json({ message: 'Gagal menambah user.' })
    }
  },
)

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.status(204).send()
})

export default router
