import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ItemCarrito } from '@/features/cart/types/cart.types'

interface CartState {
  items: ItemCarrito[]
  agregar: (item: Omit<ItemCarrito, 'cantidad'>) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  quitar: (productoId: number) => void
  vaciar: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      // Si el producto ya esta en el carrito se suma una unidad sin superar el stock
      agregar: (item) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === item.producto_id)
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === item.producto_id
                  ? { ...i, stock: item.stock, cantidad: Math.min(i.cantidad + 1, item.stock) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, cantidad: 1 }] }
        }),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.producto_id === productoId ? { ...i, cantidad: Math.min(cantidad, i.stock) } : i,
            )
            .filter((i) => i.cantidad > 0),
        })),

      quitar: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.producto_id !== productoId) })),

      vaciar: () => set({ items: [] }),
    }),
    { name: 'food-store-cart', partialize: (state) => ({ items: state.items }) },
  ),
)
