import { isAxiosError } from 'axios'

interface DetalleValidacion {
  msg: string
}

// Convierte cualquier error de la API en un mensaje legible para el usuario
export function mensajeDeError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor'
    const detail: unknown = (error.response.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return (detail as DetalleValidacion[]).map((d) => d.msg).join('. ')
    }
    return 'Ocurrio un error inesperado'
  }
  if (error instanceof Error) return error.message
  return 'Ocurrio un error inesperado'
}
