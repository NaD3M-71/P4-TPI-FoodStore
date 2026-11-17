import { Navigate, Outlet } from 'react-router-dom'
import type { Rol } from '@/features/auth/types/auth.types'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  allowedRoles?: Rol[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)

  if (cargando) return <p className="p-6 text-gray-500">Verificando sesion...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}
