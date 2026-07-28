import { useEffect } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuthStore'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import OwnerUsers from '@/pages/OwnerUsers'

export default function App() {
  const { user, isChecking, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2e8] px-4 text-sm text-zinc-600">
        Memuat sesi login...
      </main>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />
        <Route
          path="/owner/users"
          element={
            user ? (
              user.role === 'owner' ? (
                <OwnerUsers />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}
