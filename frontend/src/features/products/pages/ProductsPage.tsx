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
import { useCategories, type Categoria } from '@/features/categories'
import Button from '@/shared/components/ui/Button'
import { CampoCheckbox, CampoTexto, MensajeError } from '@/shared/components/ui/Campos'
import ErrorState from '@/shared/components/ui/ErrorState'
import LoadingState from '@/shared/components/ui/LoadingState'
import ProductoList from '../components/ProductoList'
import ProductoModal from '../components/ProductoModal'
import { useProducts } from '../hooks/useProducts'
import type { Producto, ProductoForm, ProductoFormValues } from '../types/producto'

const columnHelper = createColumnHelper<Producto>()

// Constantes fuera del componente: conservan la misma referencia entre renders
const sinProductos: Producto[] = []
const sinCategorias: Categoria[] = []
const valoresVacios: ProductoFormValues = {
  nombre: '',
  descripcion: '',
  precio_base: '',
  imagenes: '',
  disponible: true,
  categoria_ids: [],
}

const formatoPrecio = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

// Convierte los valores del formulario (texto) al body que espera la API
function aProductoForm(valores: ProductoFormValues): ProductoForm {
  return {
    nombre: valores.nombre.trim(),
    descripcion: valores.descripcion.trim(),
    precio_base: Number(valores.precio_base),
    imagenes_url: valores.imagenes
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== ''),
    disponible: valores.disponible,
    categoria_ids: valores.categoria_ids,
  }
}

function ProductsPage() {
  // Los botones de crear, editar y eliminar son solo para admin (el backend igual responde 403)
  const { isAdmin: esAdmin } = useAuth()

  // Toda la logica de datos vive en los hooks de las features
  const { productos, isPending, error, refetch, crear, actualizar, eliminar } =
    useProducts()
  const guardando = crear.isPending || actualizar.isPending
  const { mutate: eliminarProducto } = eliminar

  // Las categorias se usan para mostrar sus nombres en la tabla y para el formulario
  // (se leen a traves del barrel de la feature categories)
  const { categorias: categoriasData } = useCategories()
  const categorias = categoriasData ?? sinCategorias

  // Modal controlado con un estado booleano
  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null)
  const [errorApi, setErrorApi] = useState<string | null>(null)

  const cerrarModal = () => {
    setModalAbierto(false)
    setProductoEnEdicion(null)
    setErrorApi(null)
  }

  const form = useForm({
    defaultValues: valoresVacios,
    onSubmit: ({ value }) => {
      if (guardando) return
      setErrorApi(null)
      const valores = aProductoForm(value)
      // Si la API responde con error, se muestra en el modal sin cerrarlo
      const opciones = {
        onSuccess: cerrarModal,
        onError: (e: Error) => setErrorApi(e.message),
      }
      // El mismo formulario crea o edita segun haya un producto en edicion
      if (productoEnEdicion) {
        actualizar.mutate({ id: productoEnEdicion.id, valores }, opciones)
      } else {
        crear.mutate(valores, opciones)
      }
    },
  })

  const abrirModalNuevo = () => {
    setProductoEnEdicion(null)
    setErrorApi(null)
    form.reset() // vuelve a los valores iniciales (vacios)
    setModalAbierto(true)
  }

  const abrirModalEditar = useCallback(
    (producto: Producto) => {
      setProductoEnEdicion(producto)
      setErrorApi(null)
      // keepDefaultValues: carga los valores del producto sin cambiar los iniciales
      form.reset(
        {
          nombre: producto.nombre,
          descripcion: producto.descripcion ?? '',
          precio_base: String(producto.precio_base),
          imagenes: producto.imagenes_url.join('\n'),
          disponible: producto.disponible,
          categoria_ids: producto.categoria_ids,
        },
        { keepDefaultValues: true },
      )
      setModalAbierto(true)
    },
    [form],
  )

  const confirmarEliminacion = useCallback(
    (producto: Producto) => {
      if (!window.confirm(`Seguro que queres eliminar el producto "${producto.nombre}"?`)) return
      eliminarProducto(producto.id)
    },
    [eliminarProducto],
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('nombre', { header: 'Nombre' }),
      columnHelper.accessor('precio_base', {
        header: 'Precio',
        cell: (info) => formatoPrecio.format(info.getValue()),
      }),
      // Columna calculada: nombres de las categorias del producto
      columnHelper.accessor(
        (producto) =>
          producto.categoria_ids
            .map((id) => categorias.find((c) => c.id === id)?.nombre)
            .filter((nombre): nombre is string => nombre !== undefined)
            .join(', '),
        { id: 'categorias', header: 'Categorias', cell: (info) => info.getValue() || '-' },
      ),
      columnHelper.accessor('disponible', {
        header: 'Estado',
        cell: (info) => (
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              info.getValue() ? 'bg-green-100 text-success dark:bg-green-900/40' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {info.getValue() ? 'Disponible' : 'No disponible'}
          </span>
        ),
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
    [categorias, abrirModalEditar, confirmarEliminacion],
  )

  const table = useReactTable({
    data: productos ?? sinProductos,
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
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Productos</h2>
        {esAdmin && <Button onClick={abrirModalNuevo}>Nuevo producto</Button>}
      </div>

      {isPending && <LoadingState texto="Cargando productos..." />}
      {error && <ErrorState mensaje={error.message} onReintentar={() => refetch()} />}
      {productos && <ProductoList table={table} onNuevo={esAdmin ? abrirModalNuevo : undefined} />}

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ProductoModal
            abierto={modalAbierto}
            producto={productoEnEdicion}
            error={errorApi}
            guardando={guardando}
            puedeGuardar={canSubmit}
            onSubmit={() => form.handleSubmit()}
            onCancelar={cerrarModal}
          >
            <form.Field
              name="nombre"
              validators={{
                // RN-06: obligatorio y sin ser solo espacios
                onChange: ({ value }) =>
                  !value.trim()
                    ? 'El nombre es obligatorio'
                    : value.trim().length > 150
                      ? 'El nombre no puede superar los 150 caracteres'
                      : undefined,
              }}
            >
              {(field) => <CampoTexto field={field} label="Nombre" />}
            </form.Field>

            <form.Field name="descripcion">
              {(field) => <CampoTexto field={field} label="Descripcion" multilinea />}
            </form.Field>

            <form.Field
              name="precio_base"
              validators={{
                // RN-07: el precio no puede ser negativo
                onChange: ({ value }) => {
                  if (value.trim() === '' || Number.isNaN(Number(value))) {
                    return 'Ingresa un precio valido'
                  }
                  return Number(value) < 0 ? 'El precio no puede ser negativo' : undefined
                },
              }}
            >
              {(field) => <CampoTexto field={field} label="Precio base" tipo="number" />}
            </form.Field>

            <form.Field name="imagenes">
              {(field) => <CampoTexto field={field} label="Imagenes (una URL por linea)" multilinea />}
            </form.Field>

            <form.Field name="disponible">
              {(field) => <CampoCheckbox field={field} label="Disponible" />}
            </form.Field>

            <form.Field
              name="categoria_ids"
              validators={{
                // RN-19: el producto debe tener al menos una categoria
                onChange: ({ value }) =>
                  value.length === 0 ? 'Selecciona al menos una categoria' : undefined,
              }}
            >
              {(field) => (
                <fieldset>
                  <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Categorias (al menos una)
                  </legend>
                  {categorias.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay categorias. Crea una primero desde la seccion Categorias.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {categorias.map((categoria) => (
                        <label
                          key={categoria.id}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={field.state.value.includes(categoria.id)}
                            onChange={(e) =>
                              field.handleChange(
                                e.target.checked
                                  ? [...field.state.value, categoria.id]
                                  : field.state.value.filter((id) => id !== categoria.id),
                              )
                            }
                          />
                          {categoria.nombre}
                        </label>
                      ))}
                    </div>
                  )}
                  <MensajeError field={field} />
                </fieldset>
              )}
            </form.Field>
          </ProductoModal>
        )}
      </form.Subscribe>
    </main>
  )
}

export default ProductsPage
