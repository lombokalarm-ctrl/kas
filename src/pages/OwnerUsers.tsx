import { type FormEvent, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { UserRole } from '../../shared/auth'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useUserManagementStore } from '@/hooks/useUserManagementStore'

const roleOptions: UserRole[] = ['staff', 'admin', 'owner']

export default function OwnerUsers() {
  const { user, logout } = useAuthStore()
  const {
    items,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    clearFeedback,
  } = useUserManagementStore()
  const [form, setForm] = useState({
    username: '',
    password: '',
    namaLengkap: '',
    role: 'staff' as UserRole,
  })
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    namaLengkap: '',
    password: '',
  })

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchUsers()
    }
  }, [fetchUsers, user?.role])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'owner') {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const ok = await createUser(form)

    if (ok) {
      setForm({
        username: '',
        password: '',
        namaLengkap: '',
        role: 'staff',
      })
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingUserId) {
      return
    }

    const ok = await updateUser(editingUserId, {
      namaLengkap: editForm.namaLengkap,
      password: editForm.password || undefined,
    })

    if (ok) {
      setEditingUserId(null)
      setEditForm({
        namaLengkap: '',
        password: '',
      })
    }
  }

  async function handleDeleteUser(userId: number, username: string) {
    const shouldDelete = window.confirm(`Hapus user ${username}? Tindakan ini tidak bisa dibatalkan.`)

    if (!shouldDelete) {
      return
    }

    const ok = await deleteUser(userId)

    if (ok && editingUserId === userId) {
      setEditingUserId(null)
      setEditForm({
        namaLengkap: '',
        password: '',
      })
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f0e6_0%,#fbfaf7_45%,#f1ece3_100%)] px-3 py-4 text-zinc-950 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Halaman Owner
              </p>
              <h1 className="font-display text-2xl text-zinc-950 sm:text-3xl">
                Manajemen User
              </h1>
              <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                Tambah user baru tanpa SQL manual. Default login pertama:
                <span className="ml-1 font-semibold">owner / owner123</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 sm:text-xs"
              >
                Kembali
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 sm:text-xs"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        {(error || successMessage) && (
          <section className="mb-4">
            <div
              className={`rounded-xl border px-4 py-3 text-xs shadow-sm sm:text-sm ${
                error
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span>{error || successMessage}</span>
                <button
                  type="button"
                  onClick={clearFeedback}
                  className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-4 rounded-[24px] border border-zinc-900/10 bg-white p-4 shadow-[0_18px_50px_rgba(16,24,40,0.08)] sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Tambah User</p>
          <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
                required
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
                required
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Nama lengkap</span>
              <input
                type="text"
                value={form.namaLengkap}
                onChange={(event) =>
                  setForm((current) => ({ ...current, namaLengkap: event.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Role</span>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value as UserRole }))
                }
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? 'Menyimpan...' : 'Tambah user'}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-zinc-900/10 bg-white shadow-[0_18px_50px_rgba(16,24,40,0.08)]">
          <div className="border-b border-zinc-100 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Daftar User</p>
            <h2 className="mt-1 font-display text-xl text-zinc-950">User Terdaftar</h2>
          </div>

          {isLoading ? (
            <div className="px-4 py-8 text-sm text-zinc-500">Memuat user...</div>
          ) : items.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {items.map((item) => (
                <article key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{item.username}</p>
                      <p className="text-xs text-zinc-500">{item.namaLengkap || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
                        {item.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId((current) => (current === item.id ? null : item.id))
                          setEditForm({
                            namaLengkap: item.namaLengkap || '',
                            password: '',
                          })
                        }}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-700"
                      >
                        {editingUserId === item.id ? 'Tutup' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(item.id, item.username)}
                        disabled={isSubmitting || item.id === user.id}
                        className="rounded-lg border border-rose-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-500 sm:flex sm:flex-wrap sm:gap-4">
                    <span>Status: {item.isActive ? 'aktif' : 'nonaktif'}</span>
                    <span>Login akhir: {item.lastLoginAt ? item.lastLoginAt : '-'}</span>
                  </div>
                  {editingUserId === item.id && (
                    <form onSubmit={handleEditSubmit} className="mt-3 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
                        <span>Nama lengkap</span>
                        <input
                          type="text"
                          value={editForm.namaLengkap}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              namaLengkap: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700"
                        />
                      </label>
                      <label className="space-y-1.5 text-xs text-zinc-700 sm:text-sm">
                        <span>Password baru</span>
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          placeholder="Kosongkan jika tidak diganti"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700"
                        />
                      </label>
                      <div className="sm:col-span-2 flex gap-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? 'Menyimpan...' : 'Simpan perubahan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUserId(null)
                            setEditForm({
                              namaLengkap: '',
                              password: '',
                            })
                          }}
                          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-sm text-zinc-500">Belum ada user selain default.</div>
          )}
        </section>
      </div>
    </main>
  )
}
