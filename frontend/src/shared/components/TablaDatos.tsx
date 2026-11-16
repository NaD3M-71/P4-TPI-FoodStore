import { flexRender, type Table } from '@tanstack/react-table'
import Paginacion from './Paginacion'

interface TablaDatosProps<T> {
  table: Table<T>
  placeholderBusqueda: string
}

// Dibuja una tabla de TanStack Table (headless): la instancia la crea la pagina con
// useReactTable y este componente solo se ocupa del marcado y los estilos.
function TablaDatos<T>({ table, placeholderBusqueda }: TablaDatosProps<T>) {
  const filas = table.getRowModel().rows
  const filtroGlobal = String(table.getState().globalFilter ?? '')

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <input
          type="search"
          aria-label="Buscar"
          placeholder={placeholderBusqueda}
          value={filtroGlobal}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="campo-input max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-brand"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ▲', desc: ' ▼' }[
                          header.column.getIsSorted() as string
                        ] ?? null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay resultados para la busqueda.
                </td>
              </tr>
            ) : (
              filas.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-gray-800 dark:text-gray-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Paginacion
        paginaActual={table.getState().pagination.pageIndex + 1}
        totalPaginas={Math.max(table.getPageCount(), 1)}
        totalRegistros={table.getFilteredRowModel().rows.length}
        puedeAnterior={table.getCanPreviousPage()}
        puedeSiguiente={table.getCanNextPage()}
        onAnterior={() => table.previousPage()}
        onSiguiente={() => table.nextPage()}
      />
    </div>
  )
}

export default TablaDatos
