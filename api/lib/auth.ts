import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { AuthUser, UserRole } from '../../shared/auth.js'

const TOKEN_EXPIRES_IN_SECONDS = 60 * 60 * 12

interface AuthTokenPayload {
  sub: number
  username: string
  namaLengkap: string | null
  role: UserRole
  exp: number
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

function getTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.DB_PASSWORD || 'kas-secret'
}

export function signAuthToken(user: AuthUser) {
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRES_IN_SECONDS,
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

export function verifyAuthToken(token: string): AuthUser | null {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url')

  const expectedBuffer = Buffer.from(expectedSignature)
  const actualBuffer = Buffer.from(signature)

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as AuthTokenPayload

    if (!payload?.sub || !payload?.username || !payload?.role || payload.exp * 1000 < Date.now()) {
      return null
    }

    return {
      id: payload.sub,
      username: payload.username,
      namaLengkap: payload.namaLengkap,
      role: payload.role,
    }
  } catch {
    return null
  }
}

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req)

  if (!token) {
    res.status(401).json({ message: 'Silakan login terlebih dahulu.' })
    return
  }

  const user = verifyAuthToken(token)

  if (!user) {
    res.status(401).json({ message: 'Sesi login tidak valid atau sudah habis.' })
    return
  }

  req.user = user
  next()
}

export function requireRoles(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Silakan login terlebih dahulu.' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Anda tidak punya izin untuk aksi ini.' })
      return
    }

    next()
  }
}
