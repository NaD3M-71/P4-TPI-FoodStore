import { Link } from 'react-router-dom'
import Card from './ui/Card'

function UnauthorizedPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Card title="Acceso denegado">
        <p className="text-gray-600 dark:text-gray-300">No tenes permisos para ver esta pagina.</p>
        <Link to="/categories" className="mt-4 inline-block text-sm font-medium text-brand">
          Volver al inicio
        </Link>
      </Card>
    </main>
  )
}

export default UnauthorizedPage
