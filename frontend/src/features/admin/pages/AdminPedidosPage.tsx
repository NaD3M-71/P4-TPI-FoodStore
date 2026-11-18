import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Pedido } from '@/features/orders/types/pedido.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Paginacion } from '@/shared/components/Paginacion'
import { Skeleton } from '@/shared/components/Skeleton'
import { TablaDatos } from '@/shared/components/TablaDatos'
import { BadgeEstado, type EstadoPedido } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { formatearFecha, formatearPrecio } from '@/shared/utils/formato'
import { useCambiarEstado, useTodosPedidos } from '../hooks/useAdminData'

const POR_PAGINA = 10

const ESTADOS: EstadoPedido[] = ['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']

// Misma maquina de estados que el backend: solo se ofrecen las transiciones validas
const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
}

const ETIQUETA: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparacion',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

export default function AdminPedidosPage() {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const { data, isLoading, isError, error, refetch } = useTodosPedidos(pagina, POR_PAGINA, estado)
  const cambiar = useCambiarEstado()

  const columnas: ColumnDef<Pedido>[] = [
    { id: 'id', header: 'Pedido', cell: ({ row }) => `#${row.original.id}` },
    { id: 'usuario', header: 'Cliente', cell: ({ row }) => `Usuario #${row.original.usuario_id}` },
    { id: 'fecha', header: 'Fecha', cell: ({ row }) => formatearFecha(row.original.created_at) },
    { id: 'total', header: 'Total', cell: ({ row }) => formatearPrecio(row.original.total) },
    { id: 'estado', header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const p = row.original
        const siguientes = TRANSICIONES[p.estado]
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button variante="secundario" onClick={() => setDetalle(p)}>
              Ver
            </Button>
            {siguientes.map((s) => (
              <Button
                key={s}
                variante={s === 'CANCELADO' ? 'peligro' : 'primario'}
                disabled={cambiar.isPending}
                onClick={() => cambiar.mutate({ id: p.id, estado: s })}
              >
                {s === 'CANCELADO' ? 'Cancelar' : `Pasar a ${ETIQUETA[s].toLowerCase()}`}
              </Button>
            ))}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <select
          className="campo-input sm:max-w-xs"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as EstadoPedido | '')
            setPagina(1)
          }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ETIQUETA[e]}
            </option>
          ))}
        </select>
      </div>

      {cambiar.error && (
        <p role="alert" className="text-sm text-error">
          {mensajeDeError(cambiar.error)}
        </p>
      )}
      {isLoading && <Skeleton className="h-48" />}
      {isError && <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />}
      {data && data.items.length === 0 && <EstadoVacio mensaje="No hay pedidos para mostrar." />}
      {data && data.items.length > 0 && (
        <>
          <TablaDatos columnas={columnas} datos={data.items} />
          <Paginacion pagina={pagina} porPagina={POR_PAGINA} total={data.total} onCambiar={setPagina} />
        </>
      )}

      <Modal titulo={detalle ? `Pedido #${detalle.id}` : 'Pedido'} abierto={detalle !== null} onCerrar={() => setDetalle(null)}>
        {detalle && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-gray-500">Direccion:</span> {detalle.direccion_entrega}
            </p>
            <p>
              <span className="text-gray-500">Pago:</span> {detalle.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
            </p>
            {detalle.notas && (
              <p>
                <span className="text-gray-500">Notas:</span> {detalle.notas}
              </p>
            )}
            <ul className="divide-y divide-gray-100">
              {detalle.items.map((d) => (
                <li key={d.producto_id} className="flex justify-between py-1">
                  <span>
                    {d.cantidad} x {d.nombre_producto}
                  </span>
                  <span>{formatearPrecio(d.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="text-right font-bold">Total: {formatearPrecio(detalle.total)}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
