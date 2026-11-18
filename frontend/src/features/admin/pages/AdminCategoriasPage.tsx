import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useCategorias } from '@/features/categories/hooks/useCategorias'
import type { Categoria } from '@/features/categories/types/categoria.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Skeleton } from '@/shared/components/Skeleton'
import { TablaDatos } from '@/shared/components/TablaDatos'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { CategoriaFormModal } from '../components/CategoriaFormModal'
import { useCategoriaMutations } from '../hooks/useAdminData'

export default function AdminCategoriasPage() {
  const { data, isLoading, isError, error, refetch } = useCategorias()
  const { eliminar } = useCategoriaMutations()
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)

  const abrirForm = (c: Categoria | null) => {
    setEditando(c)
    setFormAbierto(true)
  }

  const columnas: ColumnDef<Categoria>[] = [
    { id: 'nombre', header: 'Nombre', cell: ({ row }) => row.original.nombre },
    { id: 'descripcion', header: 'Descripcion', cell: ({ row }) => row.original.descripcion ?? '-' },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variante="secundario" onClick={() => abrirForm(row.original)}>
            Editar
          </Button>
          <Button variante="peligro" onClick={() => setAEliminar(row.original)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await eliminar.mutateAsync(aEliminar.id)
      setAEliminar(null)
    } catch {
      // el mensaje se muestra en el modal
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
        <Button onClick={() => abrirForm(null)}>Nueva categoria</Button>
      </div>

      {isLoading && <Skeleton className="h-40" />}
      {isError && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}
      {data && data.length === 0 && <EstadoVacio mensaje="Todavia no hay categorias." />}
      {data && data.length > 0 && <TablaDatos columnas={columnas} datos={data} />}

      {formAbierto && (
        <CategoriaFormModal abierto categoria={editando} onCerrar={() => setFormAbierto(false)} />
      )}

      <Modal titulo="Eliminar categoria" abierto={aEliminar !== null} onCerrar={() => setAEliminar(null)}>
        <p className="mb-4 text-gray-700">Se dara de baja la categoria "{aEliminar?.nombre}". Sus productos no se modifican.</p>
        {eliminar.error && (
          <p role="alert" className="mb-3 text-sm text-error">
            {mensajeDeError(eliminar.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setAEliminar(null)}>
            Volver
          </Button>
          <Button variante="peligro" disabled={eliminar.isPending} onClick={() => void confirmarEliminar()}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
