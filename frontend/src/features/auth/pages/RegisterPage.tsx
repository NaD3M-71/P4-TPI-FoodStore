import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '@/shared/components/ui/Button'
import { CampoTexto } from '@/shared/components/ui/Campos'
import ErrorState from '@/shared/components/ui/ErrorState'
import { useAuth } from '../hooks/useAuth'
import { useRegister } from '../hooks/useRegister'

interface RegisterFormValues {
  nombre: string
  apellido: string
  email: string
  celular: string
  password: string
}

const valoresVacios: RegisterFormValues = {
  nombre: '',
  apellido: '',
  email: '',
  celular: '',
  password: '',
}

const obligatorio = (mensaje: string) => (value: string) => (!value.trim() ? mensaje : undefined)

function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const registrarMutation = useRegister()

  const form = useForm({
    defaultValues: valoresVacios,
    onSubmit: ({ value }) => {
      if (registrarMutation.isPending) return
      const celular = value.celular.trim()
      registrarMutation.mutate(
        {
          nombre: value.nombre.trim(),
          apellido: value.apellido.trim(),
          email: value.email.trim(),
          celular: celular === '' ? null : celular, // el celular es opcional
          password: value.password,
        },
        {
          // Al completar el registro se redirige al login
          onSuccess: () => navigate('/login', { replace: true, state: { registrado: true } }),
        },
      )
    },
  })

  if (user) return <Navigate to="/categories" replace />

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">Crear cuenta</h2>

        {registrarMutation.isError && <ErrorState mensaje={registrarMutation.error.message} />}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="nombre"
            validators={{ onChange: ({ value }) => obligatorio('El nombre es obligatorio')(value) }}
          >
            {(field) => <CampoTexto field={field} label="Nombre" autoComplete="given-name" />}
          </form.Field>

          <form.Field
            name="apellido"
            validators={{
              onChange: ({ value }) => obligatorio('El apellido es obligatorio')(value),
            }}
          >
            {(field) => <CampoTexto field={field} label="Apellido" autoComplete="family-name" />}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value.trim()
                  ? 'El email es obligatorio'
                  : !/^\S+@\S+\.\S+$/.test(value.trim())
                    ? 'Ingresa un email valido'
                    : undefined,
            }}
          >
            {(field) => <CampoTexto field={field} label="Email" tipo="email" autoComplete="email" />}
          </form.Field>

          <form.Field name="celular">
            {(field) => (
              <CampoTexto field={field} label="Celular (opcional)" autoComplete="tel" />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              // RN-09: minimo 8 caracteres (el backend tambien limita a 72)
              onChange: ({ value }) =>
                value.length < 8
                  ? 'La contrasena debe tener al menos 8 caracteres'
                  : value.length > 72
                    ? 'La contrasena no puede superar los 72 caracteres'
                    : undefined,
            }}
          >
            {(field) => (
              <CampoTexto
                field={field}
                label="Contrasena"
                tipo="password"
                autoComplete="new-password"
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.canSubmit}>
            {(canSubmit) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || registrarMutation.isPending}
              >
                {registrarMutation.isPending ? 'Registrando...' : 'Registrarme'}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Ya tenes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand">
            Inicia sesion
          </Link>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage
