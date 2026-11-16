import { create } from 'zustand'
import api from '@/shared/api/api'
import type { LoginCredentials, MensajeResponse, UsuarioAuth, UsuarioResponse } from '../types/auth.types'

const BASE = '/api/v1/auth'

// OAuth2 password flow: el backend espera un formulario (no JSON) y el campo username
// lleva el email. El JWT llega en una cookie HttpOnly, no en el cuerpo de la respuesta.
async function loginRequest({ email, password }: LoginCredentials) {
  const formulario = new URLSearchParams({ username: email, password })
  await api.post<MensajeResponse>(`${BASE}/token`, formulario, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

async function logoutRequest() {
  await api.post<MensajeResponse>(`${BASE}/logout`)
}

// Datos del usuario autenticado: solo se conserva lo que necesita el store
async function obtenerUsuarioActual(): Promise<UsuarioAuth> {
  const { data } = await api.get<UsuarioResponse>(`${BASE}/me`)
  return {
    id: data.id,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    roles: data.roles,
  }
}

interface AuthState {
  user: UsuarioAuth | null
  checking: boolean // true mientras se verifica la sesion con GET /auth/me
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearUser: () => void // lo usa el interceptor de Axios cuando el backend responde 401
}

// Store global con los datos del usuario. NO usa persist ni guarda el token: el JWT viaja en
// la cookie HttpOnly y la sesion se recupera con GET /auth/me al iniciar.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  checking: true,

  // POST /auth/token deja la cookie; despues GET /auth/me trae los datos del usuario
  login: async (email, password) => {
    await loginRequest({ email, password })
    set({ user: await obtenerUsuarioActual() })
  },

  // Borra la cookie en el backend y limpia el store (aunque la peticion falle)
  logout: async () => {
    try {
      await logoutRequest()
    } catch {
      // Si el backend no responde igual se cierra la sesion en el frontend
    } finally {
      set({ user: null })
    }
  },

  // Se llama al iniciar la aplicacion: pregunta al backend si hay una sesion valida
  checkAuth: async () => {
    set({ checking: true })
    try {
      set({ user: await obtenerUsuarioActual() })
    } catch {
      set({ user: null })
    } finally {
      set({ checking: false })
    }
  },

  clearUser: () => set({ user: null }),
}))
