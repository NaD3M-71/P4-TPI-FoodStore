import { create } from 'zustand'

export type TipoNotificacion = 'success' | 'error'

interface NotificationState {
  message: string
  type: TipoNotificacion
  visible: boolean
  showNotification: (message: string, type?: TipoNotificacion) => void
  hideNotification: () => void
}

// Estado global de las notificaciones. El componente Toast las muestra y las oculta solo.
export const useNotificationStore = create<NotificationState>()((set) => ({
  message: '',
  type: 'success',
  visible: false,
  showNotification: (message, type = 'success') => set({ message, type, visible: true }),
  hideNotification: () => set({ visible: false }),
}))
