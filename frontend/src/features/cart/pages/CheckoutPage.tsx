import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useCrearPedido } from '@/features/orders/hooks/usePedidos'
import type { FormaPago } from '@/features/orders/types/pedido.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { primerError } from '@/shared/ui/errorCampo'
import { formatearPrecio } from '@/shared/utils/formato'
import { useCartStore } from '@/store/cartStore'

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const vaciar = useCartStore((s) => s.vaciar)
  const navigate = useNavigate()
  const { mutateAsync, error, isPending } = useCrearPedido()
  // Evita que, al vaciar el carrito tras confirmar, la pantalla redirija al carrito vacio
  const [pedidoCreado, setPedidoCreado] = useState(false)

  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: async ({ value }) => {
      try {
        const pedido = await mutateAsync({
          items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
          forma_pago: value.forma_pago,
          direccion_entrega: value.direccion_entrega.trim(),
          notas: value.notas.trim() || null,
        })
        setPedidoCreado(true)
        navigate(`/mis-pedidos/${pedido.id}`, { replace: true })
        vaciar()
      } catch {
        // el mensaje se muestra a partir del estado "error" de la mutacion
      }
    },
  })

  if (items.length === 0 && !pedidoCreado) return <Navigate to="/carrito" replace />

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-bold text-gray-800">Datos de entrega</h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="direccion_entrega"
            validators={{
              onChange: ({ value }) =>
                value.trim().length >= 5 ? undefined : 'La direccion debe tener al menos 5 caracteres',
            }}
          >
            {(field) => (
              <Input
                label="Direccion de entrega"
                name={field.name}
                value={field.state.value}
                maxLength={200}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Field name="forma_pago">
            {(field) => (
              <div className="space-y-1">
                <label htmlFor="forma_pago" className="block text-sm font-medium text-gray-700">
                  Forma de pago
                </label>
                <select
                  id="forma_pago"
                  className="campo-input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as FormaPago)}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>
            )}
          </form.Field>

          <form.Field name="notas">
            {(field) => (
              <div className="space-y-1">
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                  Notas (opcional)
                </label>
                <textarea
                  id="notas"
                  className="campo-input"
                  rows={3}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          {error && (
            <p role="alert" className="text-sm text-error">
              {mensajeDeError(error)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Confirmando...' : 'Confirmar pedido'}
          </Button>
        </form>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Resumen</h2>
        <ul className="divide-y divide-gray-100">
          {items.map((i) => (
            <li key={i.producto_id} className="flex justify-between py-2 text-sm">
              <span>
                {i.cantidad} x {i.nombre}
              </span>
              <span>{formatearPrecio(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="text-right text-lg font-bold">Total: {formatearPrecio(total)}</p>
      </Card>
    </div>
  )
}
