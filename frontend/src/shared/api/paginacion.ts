import api from './api'

interface Paginated<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

const TAMANO_PAGINA = 100 // maximo que acepta el backend por pedido

// La tabla (TanStack Table) ordena y pagina en el navegador, por eso se traen todos
// los registros. El backend pagina de a 100: se piden paginas hasta completar el total.
export async function obtenerTodos<T>(path: string): Promise<T[]> {
  const todos: T[] = []
  let offset = 0
  let total = 0
  do {
    const { data } = await api.get<Paginated<T>>(path, {
      params: { offset, limit: TAMANO_PAGINA },
    })
    todos.push(...data.items)
    total = data.total
    offset += TAMANO_PAGINA
    if (data.items.length === 0) break
  } while (offset < total)
  return todos
}
