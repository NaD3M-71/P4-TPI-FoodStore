import type { Table } from '@tanstack/react-table'
import type { Categoria } from '../types/categoria'
import TablaDatos from '@/shared/components/TablaDatos'
import Button from '@/shared/components/ui/Button'
import EmptyState from '@/shared/components/ui/EmptyState'

interface CategoriaListProps {
  table: Table<Categoria>
  onNueva?: () => void // solo se recibe si el usuario puede crear (admin)
}

// Lista de categorias: estado vacio o tabla. La tabla la crea CategoriasPage.
function CategoriaList({ table, onNueva }: CategoriaListProps) {
  if (table.getCoreRowModel().rows.length === 0) {
    return (
      <EmptyState
        titulo="Sin categorias"
        mensaje="No hay categorias cargadas todavia."
        accion={onNueva && <Button onClick={onNueva}>Crear la primera categoria</Button>}
      />
    )
  }

  return <TablaDatos table={table} placeholderBusqueda="Buscar categoria..." />
}

export default CategoriaList
