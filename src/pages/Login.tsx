import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoggingIn, error } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const ok = await login({
      username,
      password,
    })

    if (ok) {
      navigate('/', { replace: true })
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f0e6_0%,#fbfaf7_45%,#f1ece3_100%)] px-4 py-6 text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-sm items-center">
        <section className="w-full rounded-[24px] border border-zinc-900/10 bg-white p-5 shadow-[0_18px_50px_rgba(16,24,40,0.08)] sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Masuk aplikasi</p>
          <h1 className="mt-1 font-display text-2xl text-zinc-950">Catatan Kas Harian</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Login dengan username dan password sesuai role pengguna.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
                autoComplete="username"
                required
              />
            </label>

            <label className="block space-y-1.5 text-xs text-zinc-700 sm:text-sm">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:bg-white"
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-xl bg-emerald-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-50 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              {isLoggingIn ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
