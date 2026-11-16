import { useNotificationStore } from '@/store/notificationStore'
import { ApiError } from './api'

// Muestra el error de una mutacion en el Toast. Un 403 ya lo avisa el interceptor
// ("acceso denegado"), por eso aca no se repite.
export function notificarError(error: Error) {
  if (error instanceof ApiError && error.status === 403) return
  useNotificationStore.getState().showNotification(error.message, 'error')
}
