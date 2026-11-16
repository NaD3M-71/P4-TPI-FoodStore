import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/api/api'
import { notificarError } from '@/shared/api/notificarError'
import { obtenerTodos } from '@/shared/api/paginacion'
import { useNotificationStore } from '@/store/notificationStore'
import type { Producto, ProductoForm } from '../types/producto'

function listarProductos() {
  return obtenerTodos<Producto>('/productos/')
}

async function crearProducto(data: ProductoForm) {
  const respuesta = await api.post<Producto>('/productos/', data)
  return respuesta.data
}

async function actualizarProducto({ id, valores }: { id: number; valores: ProductoForm }) {
  const respuesta = await api.put<Producto>(`/productos/${id}`, valores)
  return respuesta.data
}

async function eliminarProducto(id: number) {
  await api.delete(`/productos/${id}`)
}

// CRUD de productos: encapsula las llamadas a Axios y TanStack Query
export function useProducts() {
  const queryClient = useQueryClient()
  const showNotification = useNotificationStore((state) => state.showNotification)

  // GET /productos
  const productosQuery = useQuery({
    queryKey: ['productos'],
    queryFn: listarProductos,
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['productos'] })

  // POST /productos
  const crear = useMutation({
    mutationFn: crearProducto,
    onSuccess: () => {
      invalidar()
      showNotification('Producto creado')
    },
    onError: notificarError,
  })

  // PUT /productos/{id}
  const actualizar = useMutation({
    mutationFn: actualizarProducto,
    onSuccess: () => {
      invalidar()
      showNotification('Producto actualizado')
    },
    onError: notificarError,
  })

  // DELETE /productos/{id}
  const eliminar = useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => {
      invalidar()
      showNotification('Producto eliminado')
    },
    onError: notificarError,
  })

  return {
    productos: productosQuery.data,
    isPending: productosQuery.isPending,
    isError: productosQuery.isError,
    error: productosQuery.error,
    refetch: productosQuery.refetch,
    crear,
    actualizar,
    eliminar,
  }
}
