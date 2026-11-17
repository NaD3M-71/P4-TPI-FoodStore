// Toma el primer error de validacion de un campo de TanStack Form como texto
export function primerError(errores: readonly unknown[]): string | undefined {
  const primero = errores.find((e) => e !== undefined && e !== null)
  if (primero === undefined) return undefined
  if (typeof primero === 'string') return primero
  if (typeof primero === 'object' && 'message' in primero) return String((primero as { message: unknown }).message)
  return 'Valor invalido'
}
