import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/shared/api/axiosInstance'
import type { FiltrosProductos, ProductosPaginados } from '../types/producto.types'

// La paginacion, la busqueda y el filtro por categoria se resuelven en el servidor
export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: ['productos', filtros],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ProductosPaginados>('/productos', {
        params: {
          skip: (filtros.pagina - 1) * filtros.porPagina,
          limit: filtros.porPagina,
          search: filtros.search || undefined,
          categoria_id: filtros.categoriaId ?? undefined,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}
