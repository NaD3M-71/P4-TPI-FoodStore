import { useMutation } from '@tanstack/react-query'
import api from '@/shared/api/api'
import type { RegisterData, UsuarioResponse } from '../types/auth.types'

async function registrarUsuario(datos: RegisterData) {
  const { data } = await api.post<UsuarioResponse>('/api/v1/auth/register', datos)
  return data
}

// Alta de una cuenta nueva (POST /auth/register)
export function useRegister() {
  return useMutation({ mutationFn: registrarUsuario })
}
