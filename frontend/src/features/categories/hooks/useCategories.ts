import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/api/api'
import { notificarError } from '@/shared/api/notificarError'
import { obtenerTodos } from '@/shared/api/paginacion'
import { useNotificationStore } from '@/store/notificationStore'
import type { Categoria, CategoriaForm } from '../types/categoria'

function listarCategorias() {
  return obtenerTodos<Categoria>('/categorias/')
}

async function crearCategoria(data: CategoriaForm) {
  const respuesta = await api.post<Categoria>('/categorias/', data)
  return respuesta.data
}

async function actualizarCategoria({ id, valores }: { id: number; valores: CategoriaForm }) {
  const respuesta = await api.put<Categoria>(`/categorias/${id}`, valores)
  return respuesta.data
}

async function eliminarCategoria(id: number) {
  await api.delete(`/categorias/${id}`)
}

// CRUD de categorias: encapsula las llamadas a Axios y TanStack Query
export function useCategories() {
  const queryClient = useQueryClient()
  const showNotification = useNotificationStore((state) => state.showNotification)

  // GET /categorias
  const categoriasQuery = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['categorias'] })

  // POST /categorias
  const crear = useMutation({
    mutationFn: crearCategoria,
    onSuccess: () => {
      invalidar()
      showNotification('Categoria creada')
    },
    onError: notificarError,
  })

  // PUT /categorias/{id}
  const actualizar = useMutation({
    mutationFn: actualizarCategoria,
    onSuccess: () => {
      invalidar()
      showNotification('Categoria actualizada')
    },
    onError: notificarError,
  })

  // DELETE /categorias/{id}
  const eliminar = useMutation({
    mutationFn: eliminarCategoria,
    onSuccess: () => {
      invalidar()
      showNotification('Categoria eliminada')
    },
    onError: notificarError,
  })

  return {
    categorias: categoriasQuery.data,
    isPending: categoriasQuery.isPending,
    isError: categoriasQuery.isError,
    error: categoriasQuery.error,
    refetch: categoriasQuery.refetch,
    crear,
    actualizar,
    eliminar,
  }
}
