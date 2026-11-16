import type { AnyFieldApi } from '@tanstack/react-form'

// Mensajes de error de un campo de TanStack Form (solo despues de tocarlo o de enviar)
export function MensajeError({ field }: { field: AnyFieldApi }) {
  const errores = field.state.meta.errors
  if (!field.state.meta.isTouched || errores.length === 0) return null
  return (
    <p role="alert" className="mt-1 text-xs text-error">
      {errores.map((e) => String(e)).join('. ')}
    </p>
  )
}

interface CampoTextoProps {
  field: AnyFieldApi
  label: string
  tipo?: 'text' | 'number' | 'email' | 'password'
  autoComplete?: string
  multilinea?: boolean
  placeholder?: string
}

export function CampoTexto({
  field,
  label,
  tipo = 'text',
  multilinea = false,
  placeholder,
  autoComplete,
}: CampoTextoProps) {
  const comunes = {
    id: field.name,
    name: field.name,
    placeholder,
    value: String(field.state.value ?? ''),
    onBlur: field.handleBlur,
    className: 'campo-input',
  }

  return (
    <div>
      <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
      {multilinea ? (
        <textarea
          {...comunes}
          rows={3}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      ) : (
        <input
          {...comunes}
          type={tipo}
          autoComplete={autoComplete}
          step={tipo === 'number' ? '0.01' : undefined}
          min={tipo === 'number' ? '0' : undefined}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
      <MensajeError field={field} />
    </div>
  )
}

interface CampoCheckboxProps {
  field: AnyFieldApi
  label: string
}

export function CampoCheckbox({ field, label }: CampoCheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
      <input
        id={field.name}
        name={field.name}
        type="checkbox"
        checked={Boolean(field.state.value)}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
