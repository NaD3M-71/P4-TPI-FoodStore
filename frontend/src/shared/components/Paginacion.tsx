import { Button } from '@/shared/ui/Button'

interface PaginacionProps {
  pagina: number
  porPagina: number
  total: number
  onCambiar: (pagina: number) => void
}

export function Paginacion({ pagina, porPagina, total, onCambiar }: PaginacionProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button variante="secundario" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        Anterior
      </Button>
      <span className="text-sm text-gray-600">
        Pagina {pagina} de {totalPaginas}
      </span>
      <Button variante="secundario" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)}>
        Siguiente
      </Button>
    </div>
  )
}
