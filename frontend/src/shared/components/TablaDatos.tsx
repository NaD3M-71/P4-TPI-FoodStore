import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

interface TablaDatosProps<T> {
  columnas: ColumnDef<T>[]
  datos: T[]
}

// Tabla generica basada en TanStack Table; la paginacion se resuelve en el servidor
export function TablaDatos<T>({ columnas, datos }: TablaDatosProps<T>) {
  const tabla = useReactTable({ data: datos, columns: columnas, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          {tabla.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id}>
              {grupo.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 font-medium">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {tabla.getRowModel().rows.map((fila) => (
            <tr key={fila.id} className="border-t border-gray-100">
              {fila.getVisibleCells().map((celda) => (
                <td key={celda.id} className="px-4 py-3">
                  {flexRender(celda.column.columnDef.cell, celda.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
