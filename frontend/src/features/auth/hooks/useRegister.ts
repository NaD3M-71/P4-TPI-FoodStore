import { useMutation } from '@tanstack/react-query'
import { axiosInstance } from '@/shared/api/axiosInstance'
import type { RegisterData, Usuario } from '../types/auth.types'

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const { data: usuario } = await axiosInstance.post<Usuario>('/auth/register', data)
      return usuario
    },
  })
}
