import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import Button from '@/shared/components/ui/Button'
import ErrorState from '@/shared/components/ui/ErrorState'
import LoadingState from '@/shared/components/ui/LoadingState'
import UsuarioList from '../components/UsuarioList'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAuth } from '../hooks/useAuth'
import type { UsuarioResponse } from '../types/auth.types'

const columnHelper = createColumnHelper<UsuarioResponse>()

// Constante fuera del componente: conserva la misma referencia entre renders
const sinUsuarios: UsuarioResponse[] = []

// Solo admin (lo garantiza ProtectedRoute y, ademas, el backend con require_role)
function AdminUsersPage() {
  const { user: usuarioActual } = useAuth()
  const { usuarios, isPending, error, refetch, cambiarEstado: cambiarEstadoMutation } =
    useAdminUsers()
  const { mutate: cambiarEstado } = cambiarEstadoMutation

  const columns = useMemo(
    () => [
      columnHelper.accessor((u) => `${u.nombre} ${u.apellido}`, {
        id: 'nombre',
        header: 'Nombre',
      }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor((u) => u.roles.join(', '), {
        id: 'roles',
        header: 'Roles',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('activo', {
        header: 'Estado',
        cell: (info) => (
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              info.getValue() ? 'bg-green-100 text-success dark:bg-green-900/40' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {info.getValue() ? 'Activo' : 'Desactivado'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <span className="block text-right">Acciones</span>,
        cell: ({ row }) => {
          const usuario = row.original
          const esPropio = usuario.id === usuarioActual?.id
          return (
            <div className="flex justify-end gap-2">
              {usuario.activo ? (
                <Button
                  variant="danger"
                  size="sm"
                  // Un admin no puede desactivar su propia cuenta: se quedaria sin acceso
                  disabled={esPropio || cambiarEstadoMutation.isPending}
                  title={esPropio ? 'No podes desactivar tu propia cuenta' : undefined}
                  onClick={() => cambiarEstado({ id: usuario.id, activo: true })}
                >
                  Desactivar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cambiarEstadoMutation.isPending}
                  onClick={() => cambiarEstado({ id: usuario.id, activo: false })}
                >
                  Activar
                </Button>
              )}
            </div>
          )
        },
      }),
    ],
    [usuarioActual?.id, cambiarEstado, cambiarEstadoMutation.isPending],
  )

  const table = useReactTable({
    data: usuarios ?? sinUsuarios,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Usuarios</h2>
      </div>

      {isPending && <LoadingState texto="Cargando usuarios..." />}
      {error && <ErrorState mensaje={error.message} onReintentar={() => refetch()} />}
      {usuarios && <UsuarioList table={table} />}
    </main>
  )
}

export default AdminUsersPage
