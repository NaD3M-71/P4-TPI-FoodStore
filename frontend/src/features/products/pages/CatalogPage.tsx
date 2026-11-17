import { useState } from 'react'
import { useCategorias } from '@/features/categories/hooks/useCategorias'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Paginacion } from '@/shared/components/Paginacion'
import { Skeleton } from '@/shared/components/Skeleton'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { ProductoCard } from '../components/ProductoCard'
import { useDebounce } from '../hooks/useDebounce'
import { useProductos } from '../hooks/useProductos'

const POR_PAGINA = 8

export default function CatalogPage() {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [pagina, setPagina] = useState(1)
  const search = useDebounce(busqueda.trim())

  const { data: categorias } = useCategorias()
  const { data, isLoading, isError, error, refetch } = useProductos({
    pagina,
    porPagina: POR_PAGINA,
    search,
    categoriaId,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Catalogo</h1>

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

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: POR_PAGINA }, (_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {isError && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}

      {data && data.items.length === 0 && <EstadoVacio mensaje="No se encontraron productos." />}

      {data && data.items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
          <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={data.total} onCambiar={setPagina} />
        </>
      )}
    </div>
  )
}
