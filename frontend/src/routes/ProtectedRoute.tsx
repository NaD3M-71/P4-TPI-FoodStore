import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'
import LoadingState from '@/shared/components/ui/LoadingState'

interface ProtectedRouteProps {
  allowedRoles?: string[] // si no se indica, alcanza con tener sesion
}

// Protege rutas por sesion y por rol. Lee el store de autenticacion (no el token).
// No reemplaza la validacion del backend, que sigue respondiendo 401 y 403.
function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const checking = useAuthStore((state) => state.checking)

  // Mientras se verifica la sesion con GET /auth/me no se redirige
  if (checking) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <LoadingState texto="Verificando sesion..." />
      </main>
    )
  }

  // Sin sesion: al login
  if (!user) return <Navigate to="/login" replace />

  // Con sesion pero sin ninguno de los roles permitidos: acceso denegado
  if (allowedRoles && !user.roles.some((rol) => allowedRoles.includes(rol))) {
    return <Navigate to="/unauthorized" replace />
  }

  // Sesion valida y rol permitido: se muestra la ruta hija
  return <Outlet />
}

export default ProtectedRoute
