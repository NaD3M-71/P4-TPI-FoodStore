import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/shared/ui/Button'

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((acc, i) => acc + i.cantidad, 0))
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand">
          Food Store
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {usuario ? (
            <>
              <Link to="/" className="text-gray-700 hover:text-brand">Catalogo</Link>
              <Link to="/carrito" className="text-gray-700 hover:text-brand">Carrito ({cantidad})</Link>
              <Link to="/mis-pedidos" className="text-gray-700 hover:text-brand">Mis pedidos</Link>
              {usuario.role === 'admin' && (
                <Link to="/admin" className="font-medium text-brand">Panel admin</Link>
              )}
              <span className="text-gray-500">
                {usuario.full_name} ({usuario.role === 'admin' ? 'administrador' : 'cliente'})
              </span>
              <Button variante="secundario" onClick={() => void handleLogout()}>
                Cerrar sesion
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-brand">Ingresar</Link>
              <Link to="/register" className="text-gray-700 hover:text-brand">Registrarse</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
