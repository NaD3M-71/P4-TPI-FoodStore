import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { mensajeDeError } from '@/shared/api/handleApiError'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { primerError } from '@/shared/ui/errorCampo'
import { useAuthStore } from '@/store/authStore'
import { useRegister } from '../hooks/useRegister'

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const obligatorio = (nombre: string) => ({ value }: { value: string }) =>
  value.trim() ? undefined : `${nombre} es obligatorio`

export default function RegisterPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const { mutateAsync, error, isPending } = useRegister()

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        await mutateAsync(value)
        // Tras registrarse se inicia sesion automaticamente
        await login({ username: value.username, password: value.password })
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
        <h1 className="text-2xl font-bold text-gray-800">Crear cuenta</h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="username" validators={{ onChange: obligatorio('El usuario') }}>
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

          <form.Field name="full_name" validators={{ onChange: obligatorio('El nombre completo') }}>
            {(field) => (
              <Input
                label="Nombre completo"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
                autoComplete="name"
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => (EMAIL_VALIDO.test(value) ? undefined : 'Ingresa un email valido'),
            }}
          >
            {(field) => (
              <Input
                label="Email"
                type="email"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={primerError(field.state.meta.errors)}
                autoComplete="email"
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => (value.length >= 8 ? undefined : 'La contrasena debe tener al menos 8 caracteres'),
            }}
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
                autoComplete="new-password"
              />
            )}
          </form.Field>

          {error && (
            <p role="alert" className="text-sm text-error">
              {mensajeDeError(error)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Registrarme'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Ya tenes cuenta?{' '}
          <Link to="/login" className="text-brand hover:underline">
            Inicia sesion
          </Link>
        </p>
      </Card>
    </div>
  )
}
