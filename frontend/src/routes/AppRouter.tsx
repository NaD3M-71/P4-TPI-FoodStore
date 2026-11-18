import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import CartPage from '@/features/cart/pages/CartPage'
import CheckoutPage from '@/features/cart/pages/CheckoutPage'
import MisPedidosPage from '@/features/orders/pages/MisPedidosPage'
import PedidoDetallePage from '@/features/orders/pages/PedidoDetallePage'
import CatalogPage from '@/features/products/pages/CatalogPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import { MainLayout } from '@/shared/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

// Las pantallas del panel admin se cargan bajo demanda para achicar el bundle inicial
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const AdminPedidosPage = lazy(() => import('@/features/admin/pages/AdminPedidosPage'))
const AdminProductosPage = lazy(() => import('@/features/admin/pages/AdminProductosPage'))
const AdminCategoriasPage = lazy(() => import('@/features/admin/pages/AdminCategoriasPage'))
const AdminUsuariosPage = lazy(() => import('@/features/admin/pages/AdminUsuariosPage'))

export default function AppRouter() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Cargando...</p>}>
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

        {/* Solo admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="pedidos" element={<AdminPedidosPage />} />
            <Route path="productos" element={<AdminProductosPage />} />
            <Route path="categorias" element={<AdminCategoriasPage />} />
            <Route path="usuarios" element={<AdminUsuariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  )
}
