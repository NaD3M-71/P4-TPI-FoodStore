import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  actions?: ReactNode
  children: ReactNode
}

function Card({ title, actions, children }: CardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {title && <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
      {children}
      {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
    </article>
  )
}

export default Card
