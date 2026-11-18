import { NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/admin', etiqueta: 'Resumen', end: true },
  { to: '/admin/pedidos', etiqueta: 'Pedidos', end: false },
  { to: '/admin/productos', etiqueta: 'Productos', end: false },
  { to: '/admin/categorias', etiqueta: 'Categorias', end: false },
  { to: '/admin/usuarios', etiqueta: 'Usuarios', end: false },
]

export function AdminLayout() {
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-200'}`
            }
          >
            {l.etiqueta}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
