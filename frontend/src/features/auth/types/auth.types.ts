// Usuario autenticado que guarda el AuthStore. No incluye el token: viaja en la cookie HttpOnly.
export interface UsuarioAuth {
  id: number
  nombre: string
  apellido: string
  email: string
  roles: string[] // nombres de los roles vigentes (admin, user)
}

export interface LoginCredentials {
  email: string
  password: string
}

// Body de POST /api/v1/auth/register
export interface RegisterData {
  nombre: string
  apellido: string
  email: string
  celular: string | null
  password: string
}

// Respuesta de GET /api/v1/auth/me y de los endpoints de administracion de usuarios
export interface UsuarioResponse extends UsuarioAuth {
  celular: string | null
  activo: boolean
  created_at: string
  deleted_at: string | null
}

// Respuesta de POST /auth/token y /auth/logout
export interface MensajeResponse {
  mensaje: string
}
