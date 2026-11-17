import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
}

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-brand text-white hover:bg-brand-hover',
  secundario: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  peligro: 'bg-error text-white hover:opacity-90',
}

export function Button({ variante = 'primario', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
      {...props}
    />
  )
}
