import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '@/shared/components/ui/Button'
import { CampoTexto } from '@/shared/components/ui/Campos'
import ErrorState from '@/shared/components/ui/ErrorState'
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorApi, setErrorApi] = useState<string | null>(null)

  // RegisterPage redirige aca con este estado al completar el registro
  const recienRegistrado = (location.state as { registrado?: boolean } | null)?.registrado === true

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setErrorApi(null)
      try {
        await login(value.email.trim(), value.password)
        navigate('/categories', { replace: true })
      } catch (e) {
        // Credenciales incorrectas: se muestra el mensaje sin recargar la pagina
        setErrorApi(e instanceof Error ? e.message : 'No se pudo iniciar sesion')
      }
    },
  })

  // Si ya hay sesion no tiene sentido mostrar el login
  if (user) return <Navigate to="/categories" replace />

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">Iniciar sesion</h2>

        {recienRegistrado && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-success dark:bg-green-950/40">
            Cuenta creada. Ya podes iniciar sesion.
          </p>
        )}
        {errorApi && <ErrorState mensaje={errorApi} />}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value.trim()
                  ? 'El email es obligatorio'
                  : !value.includes('@')
                    ? 'Ingresa un email valido'
                    : undefined,
            }}
          >
            {(field) => (
              <CampoTexto field={field} label="Email" tipo="email" autoComplete="username" />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => (!value ? 'La contrasena es obligatoria' : undefined),
            }}
          >
            {(field) => (
              <CampoTexto
                field={field}
                label="Contrasena"
                tipo="password"
                autoComplete="current-password"
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          No tenes cuenta?{' '}
          <Link to="/register" className="font-medium text-brand">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  )
}

export default LoginPage
