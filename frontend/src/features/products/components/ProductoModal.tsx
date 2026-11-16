import type { ReactNode } from 'react'
import type { Producto } from '../types/producto'
import FormModal from '@/shared/components/ui/FormModal'

interface ProductoModalProps {
  abierto: boolean
  producto: Producto | null // el que se edita; null cuando es un alta
  error: string | null
  guardando: boolean
  puedeGuardar: boolean
  onSubmit: () => void
  onCancelar: () => void
  children: ReactNode // campos del formulario (los arma la pagina con TanStack Form)
}

function ProductoModal({ producto, ...props }: ProductoModalProps) {
  return (
    <FormModal
      titulo={producto ? `Editar producto: ${producto.nombre}` : 'Nuevo producto'}
      {...props}
    />
  )
}

export default ProductoModal
