// API publica de la feature ingredients: lo unico que otras carpetas pueden importar
export { useIngredients } from './hooks/useIngredients'
export type { Ingrediente } from './types/ingrediente'
export { default as IngredientsPage } from './pages/IngredientsPage'
