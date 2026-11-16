import { useForm } from '@tanstack/react-form'
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth'
import Button from '@/shared/components/ui/Button'
import { CampoTexto } from '@/shared/components/ui/Campos'
import ErrorState from '@/shared/components/ui/ErrorState'
import LoadingState from '@/shared/components/ui/LoadingState'
import CategoriaList from '../components/CategoriaList'
import CategoriaModal from '../components/CategoriaModal'
import { useCategories } from '../hooks/useCategories'
import type { Categoria, CategoriaForm } from '../types/categoria'

const columnHelper = createColumnHelper<Categoria>()

// Constantes fuera del componente: conservan la misma referencia entre renders
const sinCategorias: Categoria[] = []
const valoresVacios: CategoriaForm = { nombre: '', descripcion: '' }

function CategoriesPage() {
  // Los botones de crear, editar y eliminar son solo para admin (el backend igual responde 403)
  const { isAdmin: esAdmin } = useAuth()

  // Toda la logica de datos vive en el hook de la feature
  const { categorias, isPending, error, refetch, crear, actualizar, eliminar } =
    useCategories()
  const guardando = crear.isPending || actualizar.isPending
  const { mutate: eliminarCategoria } = eliminar

  // Modal controlado con un estado booleano
  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState<Categoria | null>(null)
  const [errorApi, setErrorApi] = useState<string | null>(null)

  const cerrarModal = () => {
    setModalAbierto(false)
    setCategoriaEnEdicion(null)
    setErrorApi(null)
  }

// TanStack Form: valores iniciales y envio
  const form = useForm({
    defaultValues: valoresVacios,
    onSubmit: ({ value }) => {
      if (guardando) return
      setErrorApi(null)
      const valores: CategoriaForm = {
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim(),
      }
      // Si la API responde con error, se muestra en el modal sin cerrarlo
      const opciones = {
        onSuccess: cerrarModal,
        onError: (e: Error) => setErrorApi(e.message),
      }
      // El mismo formulario crea o edita segun haya una categoria en edicion
      if (categoriaEnEdicion) {
        actualizar.mutate({ id: categoriaEnEdicion.id, valores }, opciones)
      } else {
        crear.mutate(valores, opciones)
      }
    },
  })

  const abrirModalNueva = () => {
    setCategoriaEnEdicion(null)
    setErrorApi(null)
    form.reset() // vuelve a los valores iniciales (vacios)
    setModalAbierto(true)
  }

  const abrirModalEditar = useCallback(
    (categoria: Categoria) => {
      setCategoriaEnEdicion(categoria)
      setErrorApi(null)
      // keepDefaultValues: carga los valores de la categoria sin cambiar los iniciales
      form.reset(
        { nombre: categoria.nombre, descripcion: categoria.descripcion },
        { keepDefaultValues: true },
      )
      setModalAbierto(true)
    },
    [form],
  )

  const confirmarEliminacion = useCallback(
    (categoria: Categoria) => {
      if (!window.confirm(`Seguro que queres eliminar la categoria "${categoria.nombre}"?`)) return
      eliminarCategoria(categoria.id)
    },
    [eliminarCategoria],
  )

  // Columnas de TanStack Table
  const columns = useMemo(
    () => [
      columnHelper.accessor('nombre', { header: 'Nombre' }),
      columnHelper.accessor('descripcion', {
        header: 'Descripcion',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <span className="block text-right">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => abrirModalEditar(row.original)}>
              Editar
            </Button>
            <Button variant="danger" size="sm" onClick={() => confirmarEliminacion(row.original)}>
              Eliminar
            </Button>
          </div>
        ),
      }),
    ],
    [abrirModalEditar, confirmarEliminacion],
  )

  // HU-01: ordenamiento, busqueda y paginacion en la tabla
  const table = useReactTable({
    data: categorias ?? sinCategorias,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    // La columna de acciones (editar y eliminar) solo se ve para admin
    state: { columnVisibility: { acciones: esAdmin } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Categorias</h2>
        {esAdmin && <Button onClick={abrirModalNueva}>Nueva categoria</Button>}
      </div>

      {/* Estados: primero la carga, despues el error y por ultimo la lista (que maneja el vacio) */}
      {isPending && <LoadingState texto="Cargando categorias..." />}
      {error && <ErrorState mensaje={error.message} onReintentar={() => refetch()} />}
      {categorias && <CategoriaList table={table} onNueva={esAdmin ? abrirModalNueva : undefined} />}

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <CategoriaModal
            abierto={modalAbierto}
            categoria={categoriaEnEdicion}
            error={errorApi}
            guardando={guardando}
            puedeGuardar={canSubmit}
            onSubmit={() => form.handleSubmit()}
            onCancelar={cerrarModal}
          >
            <form.Field
              name="nombre"
              validators={{
                // RN-01: obligatorio y sin ser solo espacios
                onChange: ({ value }) =>
                  !value.trim()
                    ? 'El nombre es obligatorio'
                    : value.trim().length > 100
                      ? 'El nombre no puede superar los 100 caracteres'
                      : undefined,
              }}
            >
              {(field) => <CampoTexto field={field} label="Nombre" />}
            </form.Field>

            <form.Field name="descripcion">
              {(field) => <CampoTexto field={field} label="Descripcion" multilinea />}
            </form.Field>
          </CategoriaModal>
        )}
      </form.Subscribe>
    </main>
  )
}

export default CategoriesPage
