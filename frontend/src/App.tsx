import { useEffect } from 'react'
import AppRouter from '@/routes/AppRouter'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession)

  // Al iniciar o recargar se confirma la sesion con GET /auth/me
  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return <AppRouter />
}
