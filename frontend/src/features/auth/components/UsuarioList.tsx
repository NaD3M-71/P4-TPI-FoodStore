import type { Table } from '@tanstack/react-table'
import EmptyState from '@/shared/components/ui/EmptyState'
import TablaDatos from '@/shared/components/TablaDatos'
import type { UsuarioResponse } from '../types/auth.types'

interface UsuarioListProps {
  table: Table<UsuarioResponse>
}

// Lista de usuarios: estado vacio o tabla. La tabla la crea AdminUsersPage.
function UsuarioList({ table }: UsuarioListProps) {
  if (table.getCoreRowModel().rows.length === 0) {
    return <EmptyState titulo="Sin usuarios" mensaje="No hay usuarios registrados." />
  }

  return <TablaDatos table={table} placeholderBusqueda="Buscar usuario..." />
}

export default UsuarioList
