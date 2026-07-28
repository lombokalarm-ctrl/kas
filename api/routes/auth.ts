import { Router, type Request, type Response } from 'express'
import pool from '../db.js'
import { requireAuth, type AuthenticatedRequest, hashPassword, signAuthToken } from '../lib/auth.js'
import type { AuthUser, LoginRequest, LoginResponse, UserRole } from '../../shared/auth.js'

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

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.status(204).send()
})

export default router
