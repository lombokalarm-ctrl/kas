export type UserRole = 'staff' | 'admin' | 'owner'

export interface AuthUser {
  id: number
  username: string
  namaLengkap: string | null
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
