import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'

export default function UnauthorizedPage() {
  return (
    <Card className="mx-auto max-w-md space-y-3 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Acceso denegado</h1>
      <p className="text-gray-600">No tenes permisos para ver esta pagina.</p>
      <Link to="/" className="text-brand hover:underline">
        Volver al inicio
      </Link>
    </Card>
  )
}
