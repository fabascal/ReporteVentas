import { ReporteVentas } from '../types/reportes'
import { ReactNode } from 'react'

interface TablaVentasProps {
  reportes: ReporteVentas[]
  handleVerDetalle: (reporte: ReporteVentas) => void
  handleExportarExcel: (reporte: ReporteVentas) => void
}

export default function TablaVentas({
  reportes,
  handleVerDetalle,
  handleExportarExcel,
}: TablaVentasProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const formatLitros = (litros: number) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(litros) + ' L'
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm">
      <table className="w-full text-left text-sm text-[#617589] dark:text-slate-400">
        <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold border-b border-[#e6e8eb] dark:border-slate-700">
          <tr>
            <th className="px-6 py-4" scope="col">Fecha</th>
            <th className="px-6 py-4" scope="col">Estación</th>
            <th className="px-6 py-4 text-right text-red-600 dark:text-red-400" scope="col">Premium</th>
            <th className="px-6 py-4 text-right text-green-600 dark:text-green-400" scope="col">Magna</th>
            <th className="px-6 py-4 text-right text-gray-600 dark:text-gray-400" scope="col">Diesel</th>
            <th className="px-6 py-4 text-right text-blue-600 dark:text-blue-400" scope="col">Aceites</th>
            <th className="px-6 py-4 text-right" scope="col">Total Ventas</th>
            <th className="px-6 py-4 text-center" scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
          {reportes.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No hay reportes de ventas disponibles para mostrar.
              </td>
            </tr>
          ) : (
            reportes.map((reporte) => {
              const totalVentas = 
                (reporte.premium?.importe || 0) + 
                (reporte.magna?.importe || 0) + 
                (reporte.diesel?.importe || 0) + 
                (reporte.aceites || 0);

              return (
                <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#111418] dark:text-white whitespace-nowrap">
                    {new Date(reporte.fecha).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-[#111418] dark:text-white">{reporte.estacionNombre}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[#111418] dark:text-white font-medium">{formatCurrency(reporte.premium?.importe || 0)}</div>
                    <div className="text-xs text-[#617589] dark:text-slate-400">{formatLitros(reporte.premium?.litros || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[#111418] dark:text-white font-medium">{formatCurrency(reporte.magna?.importe || 0)}</div>
                    <div className="text-xs text-[#617589] dark:text-slate-400">{formatLitros(reporte.magna?.litros || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[#111418] dark:text-white font-medium">{formatCurrency(reporte.diesel?.importe || 0)}</div>
                    <div className="text-xs text-[#617589] dark:text-slate-400">{formatLitros(reporte.diesel?.litros || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-[#111418] dark:text-white">
                    {formatCurrency(reporte.aceites || 0)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#111418] dark:text-white">
                    {formatCurrency(totalVentas)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleVerDetalle(reporte)}
                        className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        title="Ver Detalle"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        onClick={() => handleExportarExcel(reporte)}
                        className="size-9 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        title="Exportar a Excel"
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
