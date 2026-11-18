import { useForm } from '@tanstack/react-form'
import { useCategorias } from '@/features/categories/hooks/useCategorias'
import type { Producto } from '@/features/products/types/producto.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { primerError } from '@/shared/ui/errorCampo'
import { useProductoMutations } from '../hooks/useAdminData'

interface Props {
  abierto: boolean
  producto: Producto | null
  onCerrar: () => void
}

export function ProductoFormModal({ abierto, producto, onCerrar }: Props) {
  const { crear, actualizar } = useProductoMutations()
  const { data: categorias } = useCategorias()
  const mutacion = producto ? actualizar : crear

  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      precio_base: producto ? String(producto.precio_base) : '',
      imagen_url: producto?.imagen_url ?? '',
      stock: producto ? String(producto.stock) : '0',
      disponible: producto?.disponible ?? true,
      categoria_id: producto ? String(producto.categoria_id) : '',
    },
    onSubmit: async ({ value }) => {
      const data = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      }
      try {
        if (producto) await actualizar.mutateAsync({ id: producto.id, data })
        else await crear.mutateAsync(data)
        onCerrar()
      } catch {
        // el mensaje se muestra con el estado "error" de la mutacion
      }
    },
  })

  return (
    <Modal titulo={producto ? 'Editar producto' : 'Nuevo producto'} abierto={abierto} onCerrar={onCerrar}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field
          name="nombre"
          validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'El nombre es obligatorio') }}
        >
          {(field) => (
            <Input
              label="Nombre"
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              error={primerError(field.state.meta.errors)}
            />
          )}
        </form.Field>

        <form.Field name="descripcion">
          {(field) => (
            <Input
              label="Descripcion"
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field
            name="precio_base"
            validators={{
              onChange: ({ value }) =>
                value !== '' && Number(value) >= 0 ? undefined : 'Ingresa un precio mayor o igual a 0',
            }}
          >
            {(field) => (
              <Input
                label="Precio"
                type="number"
                min={0}
                step="0.01"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Field
            name="stock"
            validators={{
              onChange: ({ value }) =>
                Number.isInteger(Number(value)) && Number(value) >= 0 && value !== ''
                  ? undefined
                  : 'El stock debe ser un entero mayor o igual a 0',
            }}
          >
            {(field) => (
              <Input
                label="Stock"
                type="number"
                min={0}
                step="1"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
              />
            )}
          </form.Field>
        </div>

        <form.Field
          name="categoria_id"
          validators={{ onChange: ({ value }) => (value ? undefined : 'Elegi una categoria') }}
        >
          {(field) => (
            <div className="space-y-1">
              <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                id="categoria_id"
                className="campo-input"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                <option value="">Seleccionar</option>
                {categorias?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {primerError(field.state.meta.errors) && (
                <p role="alert" className="text-sm text-error">
                  {primerError(field.state.meta.errors)}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="imagen_url">
          {(field) => (
            <Input
              label="URL de imagen (opcional)"
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>

        <form.Field name="disponible">
          {(field) => (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              Disponible para la venta
            </label>
          )}
        </form.Field>

        {mutacion.error && (
          <p role="alert" className="text-sm text-error">
            {mensajeDeError(mutacion.error)}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutacion.isPending}>
            {mutacion.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
