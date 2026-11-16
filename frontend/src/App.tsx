import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import AppRouter from '@/routes/AppRouter'
import Toast from '@/shared/components/Toast'

// App solo compone la aplicacion: verifica la sesion al iniciar y monta el router y el Toast
function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  // Al iniciar (o recargar) se confirma la sesion con GET /auth/me
  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  return (
    <>
      <AppRouter />
      <Toast />
    </>
  )
}

export default App
