import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/shared/api/api'
import { notificarError } from '@/shared/api/notificarError'
import { useNotificationStore } from '@/store/notificationStore'
import type { UsuarioResponse } from '../types/auth.types'

const BASE = '/api/v1/auth/admin/usuarios'

async function listarUsuarios() {
  const { data } = await api.get<UsuarioResponse[]>(BASE)
  return data
}

async function activarUsuario(id: number) {
  const { data } = await api.post<UsuarioResponse>(`${BASE}/${id}/activar`)
  return data
}

async function desactivarUsuario(id: number) {
  const { data } = await api.post<UsuarioResponse>(`${BASE}/${id}/desactivar`)
  return data
}

// Administracion de usuarios (solo admin): listado y cambio de estado
export function useAdminUsers() {
  const queryClient = useQueryClient()
  const showNotification = useNotificationStore((state) => state.showNotification)

  const usuariosQuery = useQuery({
    queryKey: ['usuarios'],
    queryFn: listarUsuarios,
  })

  // Activar y desactivar: el backend completa o limpia deleted_at (borrado logico)
  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      activo ? desactivarUsuario(id) : activarUsuario(id),
    onSuccess: (_usuario, { activo }) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      showNotification(activo ? 'Usuario desactivado' : 'Usuario activado')
    },
    onError: notificarError,
  })

  return {
    usuarios: usuariosQuery.data,
    isPending: usuariosQuery.isPending,
    isError: usuariosQuery.isError,
    error: usuariosQuery.error,
    refetch: usuariosQuery.refetch,
    cambiarEstado: cambiarEstadoMutation,
  }
}
