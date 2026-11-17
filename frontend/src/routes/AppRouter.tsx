import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import CartPage from '@/features/cart/pages/CartPage'
import CheckoutPage from '@/features/cart/pages/CheckoutPage'
import MisPedidosPage from '@/features/orders/pages/MisPedidosPage'
import PedidoDetallePage from '@/features/orders/pages/PedidoDetallePage'
import CatalogPage from '@/features/products/pages/CatalogPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import { MainLayout } from '@/shared/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Publicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Usuario autenticado (cliente o admin) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          <Route path="/mis-pedidos/:id" element={<PedidoDetallePage />} />
        </Route>

        {/* Solo admin: las pantallas se agregan en el bloque 8 */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
