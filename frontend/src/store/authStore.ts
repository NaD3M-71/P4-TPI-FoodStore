import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { axiosInstance } from '@/shared/api/axiosInstance'
import type { LoginData, Usuario } from '@/features/auth/types/auth.types'

interface AuthState {
  usuario: Usuario | null
  cargando: boolean
  login: (data: LoginData) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiarSesion: () => void
}

// Solo se persiste el usuario; el token vive en la cookie HttpOnly del backend
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async ({ username, password }) => {
        const form = new URLSearchParams()
        form.append('username', username)
        form.append('password', password)
        await axiosInstance.post('/auth/token', form)
        const { data } = await axiosInstance.get<Usuario>('/auth/me')
        set({ usuario: data })
      },

      logout: async () => {
        try {
          await axiosInstance.post('/auth/logout')
        } finally {
          set({ usuario: null })
        }
      },

      // Al iniciar la app se confirma con el backend si la cookie sigue vigente
      checkSession: async () => {
        try {
          const { data } = await axiosInstance.get<Usuario>('/auth/me')
          set({ usuario: data, cargando: false })
        } catch {
          set({ usuario: null, cargando: false })
        }
      },

      limpiarSesion: () => set({ usuario: null }),
    }),
    {
      name: 'food-store-auth',
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)
