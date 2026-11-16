import type { ReactNode, SubmitEvent } from 'react'
import Button from './Button'

interface FormModalProps {
  abierto: boolean
  titulo: string
  error: string | null
  guardando: boolean
  puedeGuardar: boolean
  onSubmit: () => void
  onCancelar: () => void
  children: ReactNode
}

// Modal con formulario. Lo abre y lo cierra el estado booleano de la pagina (useState).
// Los campos llegan como children; la logica del formulario vive en la pagina.
function FormModal({
  abierto,
  titulo,
  error,
  guardando,
  puedeGuardar,
  onSubmit,
  onCancelar,
  children,
}: FormModalProps) {
  if (!abierto) return null

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onSubmit()
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h2 id="titulo-modal" className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {titulo}
        </h2>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error bg-red-50 px-3 py-2 dark:bg-red-950/40 text-sm text-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancelar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !puedeGuardar}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormModal
