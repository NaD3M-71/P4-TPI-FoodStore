import type { Table } from '@tanstack/react-table'
import type { Ingrediente } from '../types/ingrediente'
import TablaDatos from '@/shared/components/TablaDatos'
import Button from '@/shared/components/ui/Button'
import EmptyState from '@/shared/components/ui/EmptyState'

interface IngredienteListProps {
  table: Table<Ingrediente>
  onNuevo?: () => void // solo se recibe si el usuario puede crear (admin)
}

// Lista de ingredientes: estado vacio o tabla. La tabla la crea IngredientesPage.
function IngredienteList({ table, onNuevo }: IngredienteListProps) {
  if (table.getCoreRowModel().rows.length === 0) {
    return (
      <EmptyState
        titulo="Sin ingredientes"
        mensaje="No hay ingredientes cargados todavia."
        accion={onNuevo && <Button onClick={onNuevo}>Crear el primer ingrediente</Button>}
      />
    )
  }

  return <TablaDatos table={table} placeholderBusqueda="Buscar ingrediente..." />
}

export default IngredienteList
