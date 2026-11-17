import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { Skeleton } from '@/shared/components/Skeleton'
import { BadgeEstado } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Modal } from '@/shared/ui/Modal'
import { formatearFecha, formatearPrecio } from '@/shared/utils/formato'
import { useCancelarPedido, usePedido } from '../hooks/usePedidos'

export default function PedidoDetallePage() {
  const { id } = useParams()
  const pedidoId = Number(id)
  const { data: pedido, isLoading, isError, error, refetch } = usePedido(pedidoId)
  const cancelar = useCancelarPedido()
  const [confirmando, setConfirmando] = useState(false)

  if (isLoading) return <Skeleton className="h-64" />
  if (isError || !pedido) return <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />

  const handleCancelar = async () => {
    try {
      await cancelar.mutateAsync(pedido.id)
      setConfirmando(false)
    } catch {
      // el mensaje se muestra dentro del modal
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/mis-pedidos" className="text-sm text-brand hover:underline">
        Volver a mis pedidos
      </Link>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Pedido #{pedido.id}</h1>
          <BadgeEstado estado={pedido.estado} />
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Fecha</dt>
            <dd>{formatearFecha(pedido.created_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Forma de pago</dt>
            <dd>{pedido.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Direccion de entrega</dt>
            <dd>{pedido.direccion_entrega}</dd>
          </div>
          {pedido.notas && (
            <div>
              <dt className="text-gray-500">Notas</dt>
              <dd>{pedido.notas}</dd>
            </div>
          )}
        </dl>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2">Producto</th>
              <th className="py-2 text-right">Cantidad</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((d) => (
              <tr key={d.producto_id} className="border-b border-gray-100">
                <td className="py-2">{d.nombre_producto}</td>
                <td className="py-2 text-right">{d.cantidad}</td>
                <td className="py-2 text-right">{formatearPrecio(d.precio_unitario)}</td>
                <td className="py-2 text-right">{formatearPrecio(d.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold">Total: {formatearPrecio(pedido.total)}</p>
          {pedido.estado === 'PENDIENTE' && (
            <Button variante="peligro" onClick={() => setConfirmando(true)}>
              Cancelar pedido
            </Button>
          )}
        </div>
      </Card>

      <Modal titulo="Cancelar pedido" abierto={confirmando} onCerrar={() => setConfirmando(false)}>
        <p className="mb-4 text-gray-700">
          Se cancelara el pedido #{pedido.id} y se devolvera el stock de los productos. Esta accion no se puede deshacer.
        </p>
        {cancelar.error && (
          <p role="alert" className="mb-3 text-sm text-error">
            {mensajeDeError(cancelar.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={() => setConfirmando(false)}>
            Volver
          </Button>
          <Button variante="peligro" disabled={cancelar.isPending} onClick={() => void handleCancelar()}>
            {cancelar.isPending ? 'Cancelando...' : 'Si, cancelar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
