import type { ReactNode } from 'react'
import Card from './Card'

interface EmptyStateProps {
  titulo: string
  mensaje: string
  accion?: ReactNode
}

// Estado vacio: explica que no hay datos y, si se puede, sugiere una accion
function EmptyState({ titulo, mensaje, accion }: EmptyStateProps) {
  return (
    <Card title={titulo} actions={accion}>
      <p className="text-gray-600 dark:text-gray-300">{mensaje}</p>
    </Card>
  )
}

export default EmptyState
