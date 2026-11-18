import { useForm } from '@tanstack/react-form'
import type { Categoria } from '@/features/categories/types/categoria.types'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { primerError } from '@/shared/ui/errorCampo'
import { useCategoriaMutations } from '../hooks/useAdminData'

interface Props {
  abierto: boolean
  categoria: Categoria | null
  onCerrar: () => void
}

export function CategoriaFormModal({ abierto, categoria, onCerrar }: Props) {
  const { crear, actualizar } = useCategoriaMutations()
  const mutacion = categoria ? actualizar : crear

  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      const data = { nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }
      try {
        if (categoria) await actualizar.mutateAsync({ id: categoria.id, data })
        else await crear.mutateAsync(data)
        onCerrar()
      } catch {
        // el mensaje se muestra con el estado "error" de la mutacion
      }
    },
  })

  return (
    <Modal titulo={categoria ? 'Editar categoria' : 'Nueva categoria'} abierto={abierto} onCerrar={onCerrar}>
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
          validators={{
            onChange: ({ value }) => (value.trim().length >= 2 ? undefined : 'El nombre debe tener al menos 2 caracteres'),
          }}
        >
          {(field) => (
            <Input
              label="Nombre"
              name={field.name}
              value={field.state.value}
              maxLength={100}
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
