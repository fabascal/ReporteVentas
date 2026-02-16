import { ReporteVentas } from '../types/reportes'

interface TablaEficienciaProps {
  reportes: ReporteVentas[]
  handleVerDetalle: (reporte: ReporteVentas) => void
  handleExportarExcel: (reporte: ReporteVentas) => void
}

export default function TablaEficiencia({
  reportes,
  handleVerDetalle,
  handleExportarExcel,
}: TablaEficienciaProps) {
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value / 100)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)
  }

  const getEfficiencyColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400'
    if (value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm">
      <table className="w-full text-left text-sm text-[#617589] dark:text-slate-400">
        <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold border-b border-[#e6e8eb] dark:border-slate-700">
          <tr>
            <th className="px-6 py-4" scope="col">Fecha</th>
            <th className="px-6 py-4" scope="col">Estación</th>
            <th className="px-6 py-4 text-center text-red-600 dark:text-red-400" scope="col" colSpan={2}>Premium (ER)</th>
            <th className="px-6 py-4 text-center text-green-600 dark:text-green-400" scope="col" colSpan={2}>Magna (ER)</th>
            <th className="px-6 py-4 text-center text-gray-600 dark:text-gray-400" scope="col" colSpan={2}>Diesel (ER)</th>
            <th className="px-6 py-4 text-center" scope="col">Acciones</th>
          </tr>
          <tr className="border-t border-[#e6e8eb] dark:border-slate-700 bg-gray-50/50 dark:bg-[#101922]/50">
            <th className="px-6 py-2"></th>
            <th className="px-6 py-2"></th>
            <th className="px-6 py-2 text-right text-xs">Litros</th>
            <th className="px-6 py-2 text-right text-xs">%</th>
            <th className="px-6 py-2 text-right text-xs">Litros</th>
            <th className="px-6 py-2 text-right text-xs">%</th>
            <th className="px-6 py-2 text-right text-xs">Litros</th>
            <th className="px-6 py-2 text-right text-xs">%</th>
            <th className="px-6 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
          {reportes.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No hay reportes de eficiencia disponibles para mostrar.
              </td>
            </tr>
          ) : (
            reportes.map((reporte) => (
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
                
                {/* Premium */}
                <td className={`px-6 py-4 text-right font-medium ${getEfficiencyColor(reporte.premium?.eficienciaReal || 0)}`}>
                  {formatNumber(reporte.premium?.eficienciaReal || 0)}
                </td>
                <td className={`px-6 py-4 text-right font-medium ${getEfficiencyColor(reporte.premium?.eficienciaRealPorcentaje || 0)}`}>
                  {formatPercent(reporte.premium?.eficienciaRealPorcentaje || 0)}
                </td>

                {/* Magna */}
                <td className={`px-6 py-4 text-right font-medium ${getEfficiencyColor(reporte.magna?.eficienciaReal || 0)}`}>
                  {formatNumber(reporte.magna?.eficienciaReal || 0)}
                </td>
                <td className={`px-6 py-4 text-right font-medium ${getEfficiencyColor(reporte.magna?.eficienciaRealPorcentaje || 0)}`}>
                  {formatPercent(reporte.magna?.eficienciaRealPorcentaje || 0)}
                </td>

                {/* Diesel */}
                <td className={`px-6 py-4 text-right font-medium ${getEfficiencyColor(reporte.diesel?.eficienciaReal || 0)}`}>
                  {formatNumber(reporte.diesel?.eficienciaReal || 0)}
                </td>
                <td className={`px-6 py-4 text-right font-medium ${getEfficiencyColor(reporte.diesel?.eficienciaRealPorcentaje || 0)}`}>
                  {formatPercent(reporte.diesel?.eficienciaRealPorcentaje || 0)}
                </td>

                <td className="px-6 py-4 text-center">
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
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
