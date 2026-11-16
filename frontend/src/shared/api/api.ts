import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Error de la API con el mensaje ya listo para mostrar y el codigo HTTP
export class ApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Instancia unica: todas las peticiones del frontend pasan por aca.
// withCredentials hace que el navegador envie la cookie HttpOnly en cada peticion.
// Los interceptores de respuesta (401 y 403) se registran en setupInterceptors.ts.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Interceptor de solicitud: no se define a proposito. El JWT viaja en la cookie HttpOnly,
// que JavaScript no puede leer, y el navegador la adjunta solo (el frontend no maneja el token).

export default api
