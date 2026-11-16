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
import IngredienteList from '../components/IngredienteList'
import IngredienteModal from '../components/IngredienteModal'
import { useIngredients } from '../hooks/useIngredients'
import type { Ingrediente, IngredienteForm, IngredienteFormValues } from '../types/ingrediente'

const columnHelper = createColumnHelper<Ingrediente>()

// Constantes fuera del componente: conservan la misma referencia entre renders
const sinIngredientes: Ingrediente[] = []
const valoresVacios: IngredienteFormValues = { nombre: '', descripcion: '' }

function IngredientsPage() {
  // Los botones de crear, editar y eliminar son solo para admin (el backend igual responde 403)
  const { isAdmin: esAdmin } = useAuth()

  // Toda la logica de datos vive en el hook de la feature
  const { ingredientes, isPending, error, refetch, crear, actualizar, eliminar } =
    useIngredients()
  const guardando = crear.isPending || actualizar.isPending
  const { mutate: eliminarIngrediente } = eliminar

  // Modal controlado con un estado booleano
  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [ingredienteEnEdicion, setIngredienteEnEdicion] = useState<Ingrediente | null>(null)
  const [errorApi, setErrorApi] = useState<string | null>(null)

  const cerrarModal = () => {
    setModalAbierto(false)
    setIngredienteEnEdicion(null)
    setErrorApi(null)
  }

  const form = useForm({
    defaultValues: valoresVacios,
    onSubmit: ({ value }) => {
      if (guardando) return
      setErrorApi(null)
      const descripcion = value.descripcion.trim()
      const valores: IngredienteForm = {
        nombre: value.nombre.trim(),
        descripcion: descripcion === '' ? null : descripcion,
      }
      // Si la API responde con error, se muestra en el modal sin cerrarlo
      const opciones = {
        onSuccess: cerrarModal,
        onError: (e: Error) => setErrorApi(e.message),
      }
      // El mismo formulario crea o edita segun haya un ingrediente en edicion
      if (ingredienteEnEdicion) {
        actualizar.mutate({ id: ingredienteEnEdicion.id, valores }, opciones)
      } else {
        crear.mutate(valores, opciones)
      }
    },
  })

  const abrirModalNuevo = () => {
    setIngredienteEnEdicion(null)
    setErrorApi(null)
    form.reset() // vuelve a los valores iniciales (vacios)
    setModalAbierto(true)
  }

  const abrirModalEditar = useCallback(
    (ingrediente: Ingrediente) => {
      setIngredienteEnEdicion(ingrediente)
      setErrorApi(null)
      // keepDefaultValues: carga los valores del ingrediente sin cambiar los iniciales
      form.reset(
        { nombre: ingrediente.nombre, descripcion: ingrediente.descripcion ?? '' },
        { keepDefaultValues: true },
      )
      setModalAbierto(true)
    },
    [form],
  )

  const confirmarEliminacion = useCallback(
    (ingrediente: Ingrediente) => {
      if (!window.confirm(`Seguro que queres eliminar el ingrediente "${ingrediente.nombre}"?`)) {
        return
      }
      eliminarIngrediente(ingrediente.id)
    },
    [eliminarIngrediente],
  )

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

  const table = useReactTable({
    data: ingredientes ?? sinIngredientes,
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
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Ingredientes</h2>
        {esAdmin && <Button onClick={abrirModalNuevo}>Nuevo ingrediente</Button>}
      </div>

      {isPending && <LoadingState texto="Cargando ingredientes..." />}
      {error && <ErrorState mensaje={error.message} onReintentar={() => refetch()} />}
      {ingredientes && <IngredienteList table={table} onNuevo={esAdmin ? abrirModalNuevo : undefined} />}

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <IngredienteModal
            abierto={modalAbierto}
            ingrediente={ingredienteEnEdicion}
            error={errorApi}
            guardando={guardando}
            puedeGuardar={canSubmit}
            onSubmit={() => form.handleSubmit()}
            onCancelar={cerrarModal}
          >
            <form.Field
              name="nombre"
              validators={{
                // RN-10: el nombre es obligatorio y no puede ser solo espacios
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
              {(field) => <CampoTexto field={field} label="Descripcion (opcional)" multilinea />}
            </form.Field>
          </IngredienteModal>
        )}
      </form.Subscribe>
    </main>
  )
}

export default IngredientsPage
