import type { Table } from '@tanstack/react-table'
import type { Producto } from '../types/producto'
import TablaDatos from '@/shared/components/TablaDatos'
import Button from '@/shared/components/ui/Button'
import EmptyState from '@/shared/components/ui/EmptyState'

interface ProductoListProps {
  table: Table<Producto>
  onNuevo?: () => void // solo se recibe si el usuario puede crear (admin)
}

// Lista de productos: estado vacio o tabla. La tabla la crea ProductsPage.
function ProductoList({ table, onNuevo }: ProductoListProps) {
  if (table.getCoreRowModel().rows.length === 0) {
    return (
      <EmptyState
        titulo="Sin productos"
        mensaje="No hay productos cargados todavia."
        accion={onNuevo && <Button onClick={onNuevo}>Crear el primer producto</Button>}
      />
    )
  }

  return <TablaDatos table={table} placeholderBusqueda="Buscar producto..." />
}

export default ProductoList
