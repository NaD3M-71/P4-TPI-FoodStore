export interface Categoria {
  id: number
  nombre: string
  descripcion: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Body de POST y PUT /categorias (y valores que maneja el formulario)
export type CategoriaForm = Pick<Categoria, 'nombre' | 'descripcion'>
