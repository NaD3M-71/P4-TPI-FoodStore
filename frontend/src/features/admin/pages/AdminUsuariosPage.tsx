import type { ColumnDef } from '@tanstack/react-table'
import type { Usuario } from '@/features/auth/types/auth.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { Skeleton } from '@/shared/components/Skeleton'
import { TablaDatos } from '@/shared/components/TablaDatos'
import { Button } from '@/shared/ui/Button'
import { formatearFecha } from '@/shared/utils/formato'
import { useAuthStore } from '@/store/authStore'
import { useCambiarActivacion, useUsuarios } from '../hooks/useAdminData'

export default function AdminUsuariosPage() {
  const yo = useAuthStore((s) => s.usuario)
  const { data, isLoading, isError, error, refetch } = useUsuarios()
  const cambiar = useCambiarActivacion()

  const columnas: ColumnDef<Usuario>[] = [
    { id: 'username', header: 'Usuario', cell: ({ row }) => row.original.username },
    { id: 'nombre', header: 'Nombre', cell: ({ row }) => row.original.full_name },
    { id: 'email', header: 'Email', cell: ({ row }) => row.original.email },
    { id: 'rol', header: 'Rol', cell: ({ row }) => (row.original.role === 'admin' ? 'Administrador' : 'Cliente') },
    { id: 'alta', header: 'Alta', cell: ({ row }) => formatearFecha(row.original.created_at) },
    {
      id: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={row.original.disabled ? 'text-error' : 'text-success'}>
          {row.original.disabled ? 'Desactivado' : 'Activo'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const u = row.original
        // Un administrador no puede desactivarse a si mismo
        if (u.id === yo?.id) return <span className="text-gray-400">Tu cuenta</span>
        return (
          <Button
            variante={u.disabled ? 'secundario' : 'peligro'}
            disabled={cambiar.isPending}
            onClick={() => cambiar.mutate({ id: u.id, activar: u.disabled })}
          >
            {u.disabled ? 'Activar' : 'Desactivar'}
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
      {cambiar.error && (
        <p role="alert" className="text-sm text-error">
          {mensajeDeError(cambiar.error)}
        </p>
      )}
      {isLoading && <Skeleton className="h-48" />}
      {isError && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}
      {data && <TablaDatos columnas={columnas} datos={data} />}
    </div>
  )
}
