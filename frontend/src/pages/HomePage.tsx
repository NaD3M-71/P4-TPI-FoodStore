import { useAuthStore } from '@/store/authStore'

// Pantalla provisoria: el catalogo se implementa en el bloque 7
export default function HomePage() {
  const usuario = useAuthStore((s) => s.usuario)
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-gray-800">Bienvenido a Food Store</h1>
      {usuario && <p className="text-gray-600">Sesion iniciada como {usuario.full_name}.</p>}
    </div>
  )
}
