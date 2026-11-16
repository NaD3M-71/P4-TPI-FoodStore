import Button from './Button'

interface ErrorStateProps {
  mensaje: string
  onReintentar?: () => void
}

// Estado de error: muestra el mensaje y, si se recibe la funcion, un boton para reintentar
function ErrorState({ mensaje, onReintentar }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-error bg-red-50 p-4 dark:bg-red-950/40 text-error"
    >
      <p>{mensaje}</p>
      {onReintentar && (
        <Button variant="outline" size="sm" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export default ErrorState
