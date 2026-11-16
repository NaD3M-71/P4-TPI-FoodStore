import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/api/api'
import { notificarError } from '@/shared/api/notificarError'
import { obtenerTodos } from '@/shared/api/paginacion'
import { useNotificationStore } from '@/store/notificationStore'
import type { Ingrediente, IngredienteForm } from '../types/ingrediente'

function listarIngredientes() {
  return obtenerTodos<Ingrediente>('/ingredientes/')
}

async function crearIngrediente(data: IngredienteForm) {
  const respuesta = await api.post<Ingrediente>('/ingredientes/', data)
  return respuesta.data
}

async function actualizarIngrediente({ id, valores }: { id: number; valores: IngredienteForm }) {
  const respuesta = await api.put<Ingrediente>(`/ingredientes/${id}`, valores)
  return respuesta.data
}

async function eliminarIngrediente(id: number) {
  await api.delete(`/ingredientes/${id}`)
}

// CRUD de ingredientes: encapsula las llamadas a Axios y TanStack Query
export function useIngredients() {
  const queryClient = useQueryClient()
  const showNotification = useNotificationStore((state) => state.showNotification)

  // GET /ingredientes
  const ingredientesQuery = useQuery({
    queryKey: ['ingredientes'],
    queryFn: listarIngredientes,
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['ingredientes'] })

  // POST /ingredientes
  const crear = useMutation({
    mutationFn: crearIngrediente,
    onSuccess: () => {
      invalidar()
      showNotification('Ingrediente creado')
    },
    onError: notificarError,
  })

  // PUT /ingredientes/{id}
  const actualizar = useMutation({
    mutationFn: actualizarIngrediente,
    onSuccess: () => {
      invalidar()
      showNotification('Ingrediente actualizado')
    },
    onError: notificarError,
  })

  // DELETE /ingredientes/{id}
  const eliminar = useMutation({
    mutationFn: eliminarIngrediente,
    onSuccess: () => {
      invalidar()
      showNotification('Ingrediente eliminado')
    },
    onError: notificarError,
  })

  return {
    ingredientes: ingredientesQuery.data,
    isPending: ingredientesQuery.isPending,
    isError: ingredientesQuery.isError,
    error: ingredientesQuery.error,
    refetch: ingredientesQuery.refetch,
    crear,
    actualizar,
    eliminar,
  }
}
