import type { ReactNode } from 'react'
import type { Categoria } from '../types/categoria'
import FormModal from '@/shared/components/ui/FormModal'

interface CategoriaModalProps {
  abierto: boolean
  categoria: Categoria | null // la que se edita; null cuando es un alta
  error: string | null
  guardando: boolean
  puedeGuardar: boolean
  onSubmit: () => void
  onCancelar: () => void
  children: ReactNode // campos del formulario (los arma la pagina con TanStack Form)
}

function CategoriaModal({ categoria, ...props }: CategoriaModalProps) {
  return (
    <FormModal
      titulo={categoria ? `Editar categoria: ${categoria.nombre}` : 'Nueva categoria'}
      {...props}
    />
  )
}

export default CategoriaModal
