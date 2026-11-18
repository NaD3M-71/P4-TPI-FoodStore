import { mensajeDeError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { Skeleton } from '@/shared/components/Skeleton'
import { Card } from '@/shared/ui/Card'
import { formatearPrecio } from '@/shared/utils/formato'
import { useResumen } from '../hooks/useAdminData'

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useResumen()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }
  if (isError || !data) return <EstadoError mensaje={mensajeDeError(error)} onReintentar={() => void refetch()} />

  const tarjetas = [
    { titulo: 'Pedidos pendientes', valor: String(data.pendientes) },
    { titulo: 'En preparacion', valor: String(data.en_preparacion) },
    { titulo: 'Entregados', valor: String(data.entregados) },
    { titulo: 'Cancelados', valor: String(data.cancelados) },
    { titulo: 'Pedidos de hoy', valor: String(data.pedidos_hoy) },
    { titulo: 'Ingresos (entregados)', valor: formatearPrecio(data.ingresos_entregados) },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Panel de administracion</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((t) => (
          <Card key={t.titulo}>
            <p className="text-sm text-gray-500">{t.titulo}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{t.valor}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
