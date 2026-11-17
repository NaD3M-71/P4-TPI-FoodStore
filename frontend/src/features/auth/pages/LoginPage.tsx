import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { primerError } from '@/shared/ui/errorCampo'
import { useAuthStore } from '@/store/authStore'
import { useLogin } from '../hooks/useLogin'

export default function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()
  const { mutateAsync, error, isPending } = useLogin()

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value)
        navigate('/', { replace: true })
      } catch {
        // el mensaje se muestra a partir del estado "error" de la mutacion
      }
    },
  })

  if (usuario) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-md">
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-bold text-gray-800">Iniciar sesion</h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'El usuario es obligatorio') }}
          >
            {(field) => (
              <Input
                label="Usuario"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
                autoComplete="username"
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'La contrasena es obligatoria') }}
          >
            {(field) => (
              <Input
                label="Contrasena"
                type="password"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
                autoComplete="current-password"
              />
            )}
          </form.Field>

          {error && (
            <p role="alert" className="text-sm text-error">
              {mensajeDeError(error)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          No tenes cuenta?{' '}
          <Link to="/register" className="text-brand hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
