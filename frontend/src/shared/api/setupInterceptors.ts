import type { AxiosError } from 'axios'
import { useAuthStore } from '@/features/auth'
import { useNotificationStore } from '@/store/notificationStore'
import api, { ApiError } from './api'

// El backend responde errores como {"detail": "..."}; los 422 traen una lista en detail
function mensajeDeError(body: unknown, status: number | null): string {
  if (body !== null && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const mensajes = detail
        .map((d) => (d !== null && typeof d === 'object' && 'msg' in d ? String(d.msg) : ''))
        .filter(Boolean)
      if (mensajes.length > 0) return mensajes.join('. ')
    }
  }
  return status === null ? 'No se pudo conectar con el servidor' : `Error ${status} en la solicitud`
}

// El 401 del login (credenciales incorrectas) y el de /auth/me (todavia no hay sesion)
// son respuestas esperadas: no significan que una sesion haya vencido.
const RUTAS_SIN_LIMPIEZA = ['/api/v1/auth/token', '/api/v1/auth/me']

// Interceptor de respuesta global. Se importa una sola vez en main.tsx.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? null
    const url = error.config?.url ?? ''

    // 401: sesion vencida o invalida. Se limpia el store y ProtectedRoute lleva al login.
    if (status === 401 && !RUTAS_SIN_LIMPIEZA.some((ruta) => url.includes(ruta))) {
      useAuthStore.getState().clearUser()
    }

    // 403: la sesion es valida pero no tiene permisos. Se avisa; no se cierra la sesion
    // ni se redirige al login.
    if (status === 403) {
      useNotificationStore
        .getState()
        .showNotification('Acceso denegado: no tenes permisos para realizar esta accion', 'error')
    }

    return Promise.reject(new ApiError(mensajeDeError(error.response?.data, status), status))
  },
)
