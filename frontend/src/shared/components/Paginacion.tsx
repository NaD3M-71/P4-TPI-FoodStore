import Button from './ui/Button'

interface PaginacionProps {
  paginaActual: number
  totalPaginas: number
  totalRegistros: number
  puedeAnterior: boolean
  puedeSiguiente: boolean
  onAnterior: () => void
  onSiguiente: () => void
}

// Botones de pagina anterior y siguiente. Los datos los da la tabla (TanStack Table).
function Paginacion({
  paginaActual,
  totalPaginas,
  totalRegistros,
  puedeAnterior,
  puedeSiguiente,
  onAnterior,
  onSiguiente,
}: PaginacionProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
      <span>
        Pagina {paginaActual} de {totalPaginas} ({totalRegistros} registros)
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onAnterior} disabled={!puedeAnterior}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={onSiguiente} disabled={!puedeSiguiente}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export default Paginacion
