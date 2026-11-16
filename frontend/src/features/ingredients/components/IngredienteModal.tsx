import type { ReactNode } from 'react'
import type { Ingrediente } from '../types/ingrediente'
import FormModal from '@/shared/components/ui/FormModal'

interface IngredienteModalProps {
  abierto: boolean
  ingrediente: Ingrediente | null // el que se edita; null cuando es un alta
  error: string | null
  guardando: boolean
  puedeGuardar: boolean
  onSubmit: () => void
  onCancelar: () => void
  children: ReactNode // campos del formulario (los arma la pagina con TanStack Form)
}

function IngredienteModal({ ingrediente, ...props }: IngredienteModalProps) {
  return (
    <FormModal
      titulo={ingrediente ? `Editar ingrediente: ${ingrediente.nombre}` : 'Nuevo ingrediente'}
      {...props}
    />
  )
}

export default IngredienteModal
