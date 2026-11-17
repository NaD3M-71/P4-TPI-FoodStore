import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/shared/api/axiosInstance'
import type { Pedido, PedidoCreate, PedidosPaginados } from '../types/pedido.types'

export function useMisPedidos(pagina: number, porPagina: number) {
  return useQuery({
    queryKey: ['pedidos', pagina, porPagina],
    queryFn: async () =>
      (
        await axiosInstance.get<PedidosPaginados>('/pedidos', {
          params: { skip: (pagina - 1) * porPagina, limit: porPagina },
        })
      ).data,
    placeholderData: keepPreviousData,
  })
}

export function usePedido(id: number) {
  return useQuery({
    queryKey: ['pedido', id],
    queryFn: async () => (await axiosInstance.get<Pedido>(`/pedidos/${id}`)).data,
  })
}

// Crear o cancelar un pedido cambia el stock, por eso tambien se invalidan los productos
function useInvalidar() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['pedidos'] }),
      qc.invalidateQueries({ queryKey: ['pedido'] }),
      qc.invalidateQueries({ queryKey: ['productos'] }),
    ])
}

export function useCrearPedido() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: async (data: PedidoCreate) => (await axiosInstance.post<Pedido>('/pedidos', data)).data,
    onSuccess: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: async (id: number) => (await axiosInstance.patch<Pedido>(`/pedidos/${id}/cancelar`)).data,
    onSuccess: invalidar,
  })
}
