import { Link, useNavigate } from 'react-router-dom'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { formatearPrecio } from '@/shared/utils/formato'
import { useCartStore } from '@/store/cartStore'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  const vaciar = useCartStore((s) => s.vaciar)
  const navigate = useNavigate()

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Carrito</h1>
        <EstadoVacio mensaje="Tu carrito esta vacio." />
        <Link to="/" className="text-brand hover:underline">
          Ir al catalogo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Carrito</h1>

      <Card className="divide-y divide-gray-100 p-0">
        {items.map((item) => (
          <div key={item.producto_id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-40 flex-1">
              <p className="font-medium text-gray-800">{item.nombre}</p>
              <p className="text-sm text-gray-500">{formatearPrecio(item.precio)} c/u</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variante="secundario"
                aria-label={`Restar una unidad de ${item.nombre}`}
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
              >
                -
              </Button>
              <span className="w-8 text-center">{item.cantidad}</span>
              <Button
                variante="secundario"
                aria-label={`Sumar una unidad de ${item.nombre}`}
                disabled={item.cantidad >= item.stock}
                onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
              >
                +
              </Button>
            </div>

            <p className="w-28 text-right font-semibold">{formatearPrecio(item.precio * item.cantidad)}</p>
            <Button variante="peligro" onClick={() => quitar(item.producto_id)}>
              Quitar
            </Button>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variante="secundario" onClick={vaciar}>
          Vaciar carrito
        </Button>
        <div className="flex items-center gap-4">
          <p className="text-lg font-bold">Total: {formatearPrecio(total)}</p>
          <Button onClick={() => navigate('/checkout')}>Finalizar compra</Button>
        </div>
      </div>
    </div>
  )
}
