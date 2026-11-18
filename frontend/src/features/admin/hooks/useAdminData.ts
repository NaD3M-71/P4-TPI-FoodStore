import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Categoria } from '@/features/categories/types/categoria.types'
import type { EstadoPedido } from '@/shared/ui/BadgeEstado'
import type { Pedido, PedidosPaginados } from '@/features/orders/types/pedido.types'
import type { Producto } from '@/features/products/types/producto.types'
import type { Usuario } from '@/features/auth/types/auth.types'
import { axiosInstance } from '@/shared/api/axiosInstance'
import type { ResumenPedidos } from '../types/admin.types'

export interface CategoriaForm {
  nombre: string
  descripcion: string | null
}

export interface ProductoForm {
  nombre: string
  descripcion: string | null
  precio_base: number
  imagen_url: string | null
  stock: number
  disponible: boolean
  categoria_id: number
}

// ---- Resumen ----
export function useResumen() {
  return useQuery({
    queryKey: ['resumen'],
    queryFn: async () => (await axiosInstance.get<ResumenPedidos>('/pedidos/resumen')).data,
  })
}

// ---- Categorias ----
export function useCategoriaMutations() {
  const qc = useQueryClient()
  const refrescar = () => qc.invalidateQueries({ queryKey: ['categorias'] })
  const crear = useMutation({
    mutationFn: async (data: CategoriaForm) => (await axiosInstance.post<Categoria>('/categories', data)).data,
    onSuccess: refrescar,
  })
  const actualizar = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoriaForm }) =>
      (await axiosInstance.put<Categoria>(`/categories/${id}`, data)).data,
    onSuccess: refrescar,
  })
  const eliminar = useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/categories/${id}`)
    },
    onSuccess: refrescar,
  })
  return { crear, actualizar, eliminar }
}

// ---- Productos ----
export function useProductoMutations() {
  const qc = useQueryClient()
  const refrescar = () => qc.invalidateQueries({ queryKey: ['productos'] })
  const crear = useMutation({
    mutationFn: async (data: ProductoForm) => (await axiosInstance.post<Producto>('/productos', data)).data,
    onSuccess: refrescar,
  })
  const actualizar = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductoForm }) =>
      (await axiosInstance.put<Producto>(`/productos/${id}`, data)).data,
    onSuccess: refrescar,
  })
  const actualizarStock = useMutation({
    mutationFn: async ({ id, stock, disponible }: { id: number; stock: number; disponible: boolean }) =>
      (await axiosInstance.patch<Producto>(`/productos/${id}/stock`, { stock, disponible })).data,
    onSuccess: refrescar,
  })
  const eliminar = useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/productos/${id}`)
    },
    onSuccess: refrescar,
  })
  return { crear, actualizar, actualizarStock, eliminar }
}

// ---- Pedidos (vista admin: todos los pedidos) ----
export function useTodosPedidos(pagina: number, porPagina: number, estado: EstadoPedido | '') {
  return useQuery({
    queryKey: ['pedidos', 'admin', pagina, porPagina, estado],
    queryFn: async () =>
      (
        await axiosInstance.get<PedidosPaginados>('/pedidos', {
          params: { skip: (pagina - 1) * porPagina, limit: porPagina, estado: estado || undefined },
        })
      ).data,
    placeholderData: keepPreviousData,
  })
}

export function useCambiarEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: EstadoPedido }) =>
      (await axiosInstance.patch<Pedido>(`/pedidos/${id}/estado`, { estado })).data,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['pedidos'] }),
        qc.invalidateQueries({ queryKey: ['pedido'] }),
        qc.invalidateQueries({ queryKey: ['productos'] }),
        qc.invalidateQueries({ queryKey: ['resumen'] }),
      ]),
  })
}

// ---- Usuarios ----
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await axiosInstance.get<Usuario[]>('/admin/usuarios')).data,
  })
}

export function useCambiarActivacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, activar }: { id: number; activar: boolean }) =>
      (await axiosInstance.post<Usuario>(`/admin/usuarios/${id}/${activar ? 'activar' : 'desactivar'}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}
