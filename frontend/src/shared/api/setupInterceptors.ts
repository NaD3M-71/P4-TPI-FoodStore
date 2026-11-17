import { isAxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { axiosInstance } from './axiosInstance'

const RUTAS_DE_SESION = ['/auth/token', '/auth/me']

// Interceptor de respuesta: si la sesion deja de ser valida se limpia el estado local
axiosInstance.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    if (isAxiosError(error) && error.response) {
      const { status, data } = error.response
      const url = error.config?.url ?? ''
      const esRutaDeSesion = RUTAS_DE_SESION.some((ruta) => url.includes(ruta))
      const detail = (data as { detail?: unknown } | undefined)?.detail
      const cuentaDesactivada = status === 400 && detail === 'Cuenta de usuario desactivada'

      if ((status === 401 && !esRutaDeSesion) || cuentaDesactivada) {
        useAuthStore.getState().limpiarSesion()
      }
    }
    return Promise.reject(error)
  },
)
