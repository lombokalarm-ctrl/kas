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

export interface ManagedUser extends AuthUser {
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface CreateUserRequest {
  username: string
  password: string
  namaLengkap?: string
  role: UserRole
}

export interface UpdateManagedUserRequest {
  namaLengkap?: string
  password?: string
}
