export interface IngredienteDeProducto {
  ingrediente_id: number
  ingrediente_nombre: string
  cantidad: number
  unidad_medida_id: number
  unidad_simbolo: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  imagenes_url: string[]
  disponible: boolean
  categoria_ids: number[]
  ingredientes: IngredienteDeProducto[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Body de POST y PUT /productos. Si no se envian ingredientes, el backend
// los deja como estaban (en el PUT) o crea el producto sin ingredientes (en el POST).
export interface ProductoForm {
  nombre: string
  descripcion: string
  precio_base: number
  imagenes_url: string[]
  disponible: boolean
  categoria_ids: number[]
}

// Valores que maneja el formulario: el precio y las imagenes son texto mientras
// se escribe, y se convierten a ProductoForm al enviar.
export interface ProductoFormValues {
  nombre: string
  descripcion: string
  precio_base: string
  imagenes: string
  disponible: boolean
  categoria_ids: number[]
}
