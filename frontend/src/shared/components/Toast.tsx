import { useEffect } from 'react'
import { useNotificationStore } from '@/store/notificationStore'

const TIEMPO_VISIBLE = 3000 // ms

// Notificacion global: se monta una sola vez en App.tsx y se oculta sola a los 3 segundos
function Toast() {
  const message = useNotificationStore((state) => state.message)
  const type = useNotificationStore((state) => state.type)
  const visible = useNotificationStore((state) => state.visible)
  const hideNotification = useNotificationStore((state) => state.hideNotification)

  useEffect(() => {
    if (!visible) return
    const temporizador = setTimeout(hideNotification, TIEMPO_VISIBLE)
    return () => clearTimeout(temporizador)
  }, [visible, message, hideNotification])

  if (!visible) return null

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`fixed right-4 bottom-4 z-20 max-w-sm rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
        type === 'error' ? 'bg-error' : 'bg-success'
      }`}
    >
      {message}
    </div>
  )
}

export default Toast
