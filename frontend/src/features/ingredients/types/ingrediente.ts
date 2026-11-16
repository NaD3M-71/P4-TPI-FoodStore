export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Body de POST y PUT /ingredientes
export interface IngredienteForm {
  nombre: string
  descripcion: string | null
}

// Valores que maneja el formulario (la descripcion vacia se envia como null)
export interface IngredienteFormValues {
  nombre: string
  descripcion: string
}
