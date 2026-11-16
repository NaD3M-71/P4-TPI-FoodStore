import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

// Hook de la feature auth: inicio y cierre de sesion y lectura del store de autenticacion
export function useAuth() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const checking = useAuthStore((state) => state.checking)
  const loginStore = useAuthStore((state) => state.login)
  const logoutStore = useAuthStore((state) => state.logout)

  const isAdmin = user?.roles.includes('admin') ?? false

  const login = async (email: string, password: string) => {
    await loginStore(email, password)
    queryClient.clear() // no reutilizar datos en cache de una sesion anterior
  }

  const logout = async () => {
    await logoutStore()
    queryClient.clear() // los datos en cache pertenecen a la sesion que se cierra
  }

  return { user, checking, isAdmin, login, logout }
}
