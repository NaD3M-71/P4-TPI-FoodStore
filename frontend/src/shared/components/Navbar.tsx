import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useThemeStore } from '@/store/themeStore'
import Button from './ui/Button'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1 text-sm font-medium ${
    isActive ? 'bg-white text-brand' : 'text-indigo-100 hover:bg-brand-hover'
  }`

function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const darkMode = useThemeStore((state) => state.darkMode)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const navigate = useNavigate()

  const cerrarSesion = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="bg-brand text-white shadow">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <h1 className="text-xl font-semibold">Catalogo de Productos</h1>

        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <>
              <NavLink to="/categories" className={linkClass}>
                Categorias
              </NavLink>
              <NavLink to="/products" className={linkClass}>
                Productos
              </NavLink>
              <NavLink to="/ingredients" className={linkClass}>
                Ingredientes
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin/users" className={linkClass}>
                  Usuarios
                </NavLink>
              )}

              <span className="ml-2 text-sm text-indigo-100">
                {user.nombre} {user.apellido}
                <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs font-medium">
                  {user.roles.join(', ')}
                </span>
              </span>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Iniciar sesion
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Registrarse
              </NavLink>
            </>
          )}

          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {darkMode ? 'Modo claro' : 'Modo oscuro'}
          </Button>
          {user && (
            <Button variant="secondary" size="sm" onClick={cerrarSesion}>
              Cerrar sesion
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
