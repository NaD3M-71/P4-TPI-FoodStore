import { useCartStore } from '@/store/cartStore'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { formatearPrecio } from '@/shared/utils/formato'
import type { Producto } from '../types/producto.types'

export function ProductoCard({ producto }: { producto: Producto }) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)
  const sinStock = !producto.disponible || producto.stock <= 0
  const alLimite = enCarrito >= producto.stock

  return (
    <Card className="flex flex-col gap-2">
      {producto.imagen_url && (
        <img src={producto.imagen_url} alt={producto.nombre} className="h-36 w-full rounded-lg object-cover" />
      )}
      <span className="text-xs font-medium uppercase text-secondary">{producto.categoria.nombre}</span>
      <h3 className="text-lg font-semibold text-gray-800">{producto.nombre}</h3>
      {producto.descripcion && <p className="text-sm text-gray-600">{producto.descripcion}</p>}
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-lg font-bold text-gray-800">{formatearPrecio(producto.precio_base)}</span>
        <span className={`text-xs ${sinStock ? 'text-error' : 'text-gray-500'}`}>
          {sinStock ? 'Agotado' : `Stock: ${producto.stock}`}
        </span>
      </div>
      <Button
        disabled={sinStock || alLimite}
        onClick={() =>
          agregar({
            producto_id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio_base,
            stock: producto.stock,
          })
        }
      >
        {sinStock ? 'No disponible' : alLimite ? 'Maximo en carrito' : 'Agregar al carrito'}
      </Button>
    </Card>
  )
}
