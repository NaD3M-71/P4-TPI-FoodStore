import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/shared/api/axiosInstance'
import type { Categoria } from '../types/categoria.types'

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await axiosInstance.get<Categoria[]>('/categories')).data,
  })
}
