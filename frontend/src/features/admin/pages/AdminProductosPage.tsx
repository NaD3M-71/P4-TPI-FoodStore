import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useCategorias } from '@/features/categories/hooks/useCategorias'
import { useDebounce } from '@/features/products/hooks/useDebounce'
import { useProductos } from '@/features/products/hooks/useProductos'
import type { Producto } from '@/features/products/types/producto.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Paginacion } from '@/shared/components/Paginacion'
import { Skeleton } from '@/shared/components/Skeleton'
import { TablaDatos } from '@/shared/components/TablaDatos'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { formatearPrecio } from '@/shared/utils/formato'
import { ProductoFormModal } from '../components/ProductoFormModal'
import { useProductoMutations } from '../hooks/useAdminData'

const POR_PAGINA = 10

function StockEditor({ producto }: { producto: Producto }) {
  const { actualizarStock } = useProductoMutations()
  const [stock, setStock] = useState(String(producto.stock))
  const valido = stock !== '' && Number.isInteger(Number(stock)) && Number(stock) >= 0
  const cambio = Number(stock) !== producto.stock

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        aria-label={`Stock de ${producto.nombre}`}
        className="campo-input w-20"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />
      <Button
        variante="secundario"
        disabled={!valido || !cambio || actualizarStock.isPending}
        onClick={() =>
          actualizarStock.mutate({ id: producto.id, stock: Number(stock), disponible: producto.disponible })
        }
      >
        Guardar
      </Button>
    </div>
  )
}

export default function AdminProductosPage() {
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const search = useDebounce(busqueda.trim())
  const { data: categorias } = useCategorias()
  const { data, isLoading, isError, error, refetch } = useProductos({ pagina, porPagina: POR_PAGINA, search, categoriaId })
  const { eliminar, actualizarStock } = useProductoMutations()

  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [aEliminar, setAEliminar] = useState<Producto | null>(null)

  const abrirForm = (p: Producto | null) => {
    setEditando(p)
    setFormAbierto(true)
  }

  const columnas: ColumnDef<Producto>[] = [
    { id: 'nombre', header: 'Producto', cell: ({ row }) => row.original.nombre },
    { id: 'categoria', header: 'Categoria', cell: ({ row }) => row.original.categoria.nombre },
    { id: 'precio', header: 'Precio', cell: ({ row }) => formatearPrecio(row.original.precio_base) },
    { id: 'stock', header: 'Stock', cell: ({ row }) => <StockEditor key={`${row.original.id}-${row.original.stock}`} producto={row.original} /> },
    {
      id: 'disponible',
      header: 'Disponible',
      cell: ({ row }) => (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.original.disponible}
            disabled={actualizarStock.isPending}
            onChange={(e) =>
              actualizarStock.mutate({
                id: row.original.id,
                stock: row.original.stock,
                disponible: e.target.checked,
              })
            }
          />
          <span className="text-xs text-gray-500">{row.original.disponible ? 'Si' : 'No'}</span>
        </label>
      ),
    },
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
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <Button onClick={() => abrirForm(null)}>Nuevo producto</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          className="campo-input sm:max-w-sm"
          placeholder="Buscar productos"
          aria-label="Buscar productos"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPagina(1)
          }}
        />
        <select
          className="campo-input sm:max-w-xs"
          aria-label="Filtrar por categoria"
          value={categoriaId ?? ''}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : null)
            setPagina(1)
          }}
        >
          <option value="">Todas las categorias</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {actualizarStock.error && (
        <p role="alert" className="text-sm text-error">
          {mensajeDeError(actualizarStock.error)}
        </p>
      )}
      {isLoading && <Skeleton className="h-48" />}
      {isError && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}
      {data && data.items.length === 0 && <EstadoVacio mensaje="No se encontraron productos." />}
      {data && data.items.length > 0 && (
        <>
          <TablaDatos columnas={columnas} datos={data.items} />
          <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={data.total} onCambiar={setPagina} />
        </>
      )}

      {formAbierto && <ProductoFormModal abierto producto={editando} onCerrar={() => setFormAbierto(false)} />}

      <Modal titulo="Eliminar producto" abierto={aEliminar !== null} onCerrar={() => setAEliminar(null)}>
        <p className="mb-4 text-gray-700">
          Se dara de baja "{aEliminar?.nombre}". Los pedidos anteriores conservan su detalle.
        </p>
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
