import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Paginacion } from '@/shared/components/Paginacion'
import { Skeleton } from '@/shared/components/Skeleton'
import { BadgeEstado } from '@/shared/ui/BadgeEstado'
import { Card } from '@/shared/ui/Card'
import { formatearFecha, formatearPrecio } from '@/shared/utils/formato'
import { useMisPedidos } from '../hooks/usePedidos'

const POR_PAGINA = 10

export default function MisPedidosPage() {
  const [pagina, setPagina] = useState(1)
  const { data, isLoading, isError, error, refetch } = useMisPedidos(pagina, POR_PAGINA)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Mis pedidos</h1>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {isError && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}

      {data && data.items.length === 0 && <EstadoVacio mensaje="Todavia no hiciste ningun pedido." />}

      {data && data.items.length > 0 && (
        <>
          <div className="space-y-3">
            {data.items.map((p) => (
              <Link key={p.id} to={`/mis-pedidos/${p.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-3 hover:border-brand">
                  <div>
                    <p className="font-semibold text-gray-800">Pedido #{p.id}</p>
                    <p className="text-sm text-gray-500">{formatearFecha(p.created_at)}</p>
                  </div>
                  <BadgeEstado estado={p.estado} />
                  <p className="font-semibold">{formatearPrecio(p.total)}</p>
                </Card>
              </Link>
            ))}
          </div>
          <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={data.total} onCambiar={setPagina} />
        </>
      )}
    </div>
  )
}
