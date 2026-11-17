import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

// Campo con etiqueta y mensaje de error; se usa dentro de los formularios de TanStack Form
export function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input id={inputId} className="campo-input" aria-invalid={error ? true : undefined} {...props} />
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
