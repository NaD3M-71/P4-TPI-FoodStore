interface LoadingStateProps {
  texto?: string
}

// Estado de carga: skeleton (la forma de la tabla) con un texto para lectores de pantalla
function LoadingState({ texto = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="space-y-3" aria-busy="true" role="status">
      <span className="sr-only">{texto}</span>
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  )
}

export default LoadingState
